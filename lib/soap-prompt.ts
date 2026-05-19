// SOAP prompt template derived from AAFP Documentation Tips and AHIMA CDI BoK
// (public sources only — no Marek IP)

export type SoapVariant = 'standard' | 'soooaap';

export function buildSoapPrompt(transcript: string, variant: SoapVariant = 'standard'): string {
  const sections =
    variant === 'soooaap'
      ? `
## Subjective
Patient's chief complaint in their own words, history of present illness (onset, location, duration, character, aggravating/alleviating factors, radiation, timing/severity), review of relevant systems, and pertinent past medical/surgical/family/social history.

## Objective (Observations)
Vital signs, physical exam findings — recorded factually, not interpretively.

## Objective (Old Data)
Prior lab results, imaging, and outside records relevant to today's encounter.

## Objective (Office Data)
Today's in-office tests: point-of-care labs, EKGs, spirometry, etc.

## Assessment
Differential diagnoses with supporting reasoning; primary working diagnosis listed first.

## Action / Plan
Treatment plan including medications (with dose/route/frequency), procedures performed today, patient education provided, referrals ordered, follow-up timeline, and return precautions.
`.trim()
      : `
## Subjective
Patient's chief complaint in their own words and relevant history of present illness (onset, location, duration, character, aggravating/alleviating factors, radiation, timing/severity). Include pertinent positives and negatives from review of systems and relevant past medical, surgical, family, and social history.

## Objective
Vital signs and pertinent physical exam findings documented factually.

## Assessment
Clinical interpretation: differential diagnoses with brief supporting reasoning; primary working diagnosis listed first.

## Plan
Treatment plan: medications (name, dose, route, frequency), in-office procedures, patient education, referrals, follow-up schedule, and return-precaution instructions.
`.trim();

  return `You are a clinical documentation assistant. Given the following dictation or conversation transcript from a medical encounter, produce a structured ${variant === 'soooaap' ? 'SOOOAAP' : 'SOAP'} note.

Rules:
- Use only information present in the transcript. Do not fabricate clinical details.
- Write in third-person clinical style (e.g., "Patient reports…", "Exam reveals…").
- If a section has no data in the transcript, write "Not documented."
- Do not include patient name, date of birth, or other direct identifiers unless explicitly dictated.
- Output only the SOAP note — no preamble or meta-commentary.

${sections}

---

Transcript:
${transcript}

---

Now produce the ${variant === 'soooaap' ? 'SOOOAAP' : 'SOAP'} note:`;
}
