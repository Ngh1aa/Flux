# Flux — Synthetic Form Dogfood 01

Status: `SYNTHETIC_DOGFOOD / NOT_DIRECT_USER_EVIDENCE`

## Provenance

This review was supplied as simulated form data to stress-test the Flux prototype and the Nova-derived questionnaire mapping. It is **not** a real participant study and must never be counted toward DIRECT_USER, PROXY, verified-session, usability, confidence, or improvement claims.

The simulated set used five profiles. Their answers are normalized here as `SD-01`…`SD-05`; no participant identity is represented.

## What this dogfood is useful for

Use it to find internal consistency problems, unclear state semantics, unsafe prototype defaults, and questions that need to be tested with real finance users later.

It may justify technical/content repairs when the issue is independently visible in source or rendered UI. It does **not** validate D-01…D-04.

## Synthetic signals worth checking

| Signal | Synthetic pattern | Product/source check |
| --- | ---: | --- |
| Available vs Reserved meaning was interpreted inconsistently | 2/5 subtracted Reserved from the headline total; others did not | Make the accounting meaning explicit in Accounts before human Round 01 |
| Demo / prototype boundary on sensitive card/review actions | 3/5 interpreted the action as prototype-only | Keep the simulation boundary visible; do not turn this into a validation claim |
| Approval impact context felt incomplete | 1/5 said information was sufficient; 2/5 partial; 2/5 insufficient | Human Task 1 should probe policy rationale, approval ownership, fees/value-date expectations |
| Money-movement state after failure was unclear | 4/5 synthetic responses were unsure | D-03 remains priority; keep `NO MONEY MOVED` explicit in the forced failure state |
| Processing vs Executed vocabulary was contradictory | repeated in synthetic responses | Repair the product state vocabulary before Round 01 |
| Policy exception counts appeared inconsistent across modules | repeated in synthetic responses | Clarify metric scope/time-window rather than pretending all counts are the same measure |
| Full card number was visible in the card surface | explicit synthetic critique | Mask by default in the prototype |
| Treasury terms and report horizons were underspecified | repeated in synthetic responses | Clarify forecast horizon and what the `03` FX threshold signals refer to |

## Repairs allowed before human research

These are source-integrity repairs, not evidence-driven product iteration:

1. remove `Processing` + `Executed` semantic contradiction;
2. mask card PAN by default;
3. make `Available` vs `Reserved` accounting language explicit;
4. label policy metrics with their scope/time window;
5. make report forecast horizon and FX-threshold count self-explanatory;
6. keep D-01…D-04 in `PLANNED_VALIDATION` until real evidence exists.

## Claims boundary

Forbidden:
- “5 Flux users tested the prototype”;
- “4/5 users were confused after failure”;
- “Flux improved usability based on this test”;
- any synthetic average presented as user research.

Allowed:
- “Synthetic dogfood exposed internal consistency risks before human Round 01.”
- “The team repaired source-visible state and privacy issues before recruitment.”

## Human gate remains unchanged

Verified DIRECT_USER sessions: **0**.  
Verified PROXY sessions: **0**.  
Round 01 remains `READY_TO_RECRUIT`.
