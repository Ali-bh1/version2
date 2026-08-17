/**
 * routes/assessment.js
 * POST /api/assessment/submit
 *
 * Receives answers + lead info, scores server-side,
 * stores in DB, returns CLIENT-SAFE result (no coaching notes).
 */
import { Router } from 'express';
import { query }  from '../db/pool.js';
import { scoreAssessment, validateAnswers } from '../services/scoring.js';
import { notifyNewLead } from '../services/mailer.js';
import { assessmentLimiter, apiLimiter } from '../middleware/rateLimiter.js';
import { assessmentRules, handleValidation } from '../middleware/validate.js';

const router = Router();

router.post(
  '/submit',
  assessmentLimiter,
  assessmentRules,
  handleValidation,
  async (req, res) => {
    const { name, email, phone, program, answers } = req.body;

    // Normalise answers to uppercase
    const normAnswers = answers.map(a => String(a).toUpperCase());

    // Server-side answer validation (belt-and-braces)
    if (!validateAnswers(normAnswers)) {
      return res.status(422).json({ error: 'Invalid answer data.' });
    }

    // Score entirely on the server
    const result = scoreAssessment(normAnswers);

    try {
      // Upsert lead (one record per email+program)
      const leadRes = await query(
        `INSERT INTO leads (name, email, phone, program, source)
         VALUES ($1, $2, $3, $4, 'assessment')
         ON CONFLICT (email, program)
         DO UPDATE SET
           name       = EXCLUDED.name,
           phone      = COALESCE(EXCLUDED.phone, leads.phone),
           updated_at = NOW()
         RETURNING id`,
        [name.trim(), email.toLowerCase().trim(), phone?.trim() || null, program]
      );
      const leadId = leadRes.rows[0].id;

      // Insert assessment submission
      const subRes = await query(
        `INSERT INTO assessment_submissions
           (lead_id, program, raw_answers, category_scores,
            top_archetype, expansion_score, coaching_notes,
            internal_flags, ip_address, user_agent)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING id`,
        [
          leadId,
          program,
          JSON.stringify(normAnswers),
          JSON.stringify(result.categoryScores),
          result.topArchetype,
          result.expansionScore,
          result.coachingNotes,
          JSON.stringify(result.internalFlags),
          req.ip,
          req.headers['user-agent']?.slice(0, 300) || null,
        ]
      );
      const submissionId = subRes.rows[0].id;

      // Audit log
      await query(
        `INSERT INTO audit_log (action, entity, entity_id, metadata, ip_address)
         VALUES ('assessment_submitted', 'assessment_submissions', $1, $2, $3)`,
        [submissionId, JSON.stringify({ program, archetype: result.topArchetype }), req.ip]
      );

      // Return CLIENT-SAFE data only — no coaching notes, no internal flags
      const response = {
        success:         true,
        submissionId,
        topArchetype:    result.topArchetype,
        expansionScore:  result.expansionScore,
        archetype:       result.archetype,       // {name, tag, theme}
        categoryScores:  result.categoryScores,
        sortedCategories: result.sortedCategories,
      };

      // Fire email notification asynchronously — never blocks the response
      notifyNewLead({
        name:      name.trim(),
        email:     email.toLowerCase().trim(),
        phone:     phone?.trim() || '',
        program,
        source:    'Assessment Quiz',
        archetype: result.topArchetype,
        scores:    result.categoryScores,
      }).catch(err => console.error('[assessment] Email notification failed:', err.message));

      return res.status(201).json(response);

    } catch (err) {
      console.error('[assessment/submit]', err.message);
      return res.status(500).json({ error: 'Could not save assessment. Please try again.' });
    }
  }
);

/**
 * GET /api/assessment/result/:submissionId
 * Returns the client-visible report for a given submission.
 * No auth required — submissionId is the "secret" (UUID v4 = 5.3×10^36 possibilities).
 */
router.get('/result/:submissionId', apiLimiter, async (req, res) => {
  const { submissionId } = req.params;

  // Basic UUID format check
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(submissionId)) {
    return res.status(400).json({ error: 'Invalid submission ID.' });
  }

  try {
    const result = await query(
      `SELECT
         s.id,
         s.program,
         s.top_archetype,
         s.expansion_score,
         s.category_scores,
         s.submitted_at,
         l.name,
         l.email
       FROM assessment_submissions s
       JOIN leads l ON l.id = s.lead_id
       WHERE s.id = $1`,
      [submissionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Result not found.' });
    }

    const row = result.rows[0];

    // Log view
    await query(
      `INSERT INTO report_history (lead_id, submission_id, ip_address)
       SELECT lead_id, $1, $2 FROM assessment_submissions WHERE id = $1`,
      [submissionId, req.ip]
    ).catch(() => {}); // non-critical

    // Archetype display data (client-safe copy only)
    const archetypeMap = {
      A: { name:'The Guard',   tag:'Deep down, more money feels risky — so you keep things safe and small.', theme:'Safety & Security' },
      B: { name:'The Prover',  tag:'You quietly feel like you have to earn the right to have it.', theme:'Worthiness' },
      C: { name:'The Hider',   tag:'Being seen feels risky, so you keep yourself a little small.', theme:'Visibility' },
      D: { name:'The Giver',   tag:"You're amazing at giving. Keeping it for yourself is the hard part.", theme:'Receiving' },
      E: { name:'The Gripper', tag:"If you're not holding on tight, it feels like it'll slip away.", theme:'Control & Ease' },
    };
    const archetype = archetypeMap[row.top_archetype] || {};

    return res.json({
      submissionId:   row.id,
      name:           row.name,
      program:        row.program,
      topArchetype:   row.top_archetype,
      expansionScore: row.expansion_score,
      categoryScores: row.category_scores,
      archetype,
      submittedAt:    row.submitted_at,
    });

  } catch (err) {
    console.error('[assessment/result]', err.message);
    return res.status(500).json({ error: 'Could not load result.' });
  }
});

export default router;
