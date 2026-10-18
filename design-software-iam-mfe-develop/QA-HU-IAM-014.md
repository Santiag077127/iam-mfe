# HU-IAM-014 - QA Validation Guide

## Objective

Validate the IAM MFE password recovery flow: request a password reset link,
set a new password with a valid token, and display secure messages when the
request fails or the token is invalid.

## Delivery Information

| Field | Value |
| --- | --- |
| User story | HU-IAM-014 |
| Name | [FRONTEND] Recover and set a new password |
| Repository | <https://github.com/code-sena/design-software-iam-mfe> |
| Review branch | <https://github.com/code-sena/design-software-iam-mfe/tree/hu-014-dev> |
| Functional fix commit | <https://github.com/code-sena/design-software-iam-mfe/commit/279c5bc366ca7410fd224b4f96e7df1f4d89ac7e> |
| Latest QA fix commit | <https://github.com/code-sena/design-software-iam-mfe/commit/ecdbd81a276e3804708ac3e937c8b5b6f063ee76> |
| QA document | `QA-HU-IAM-014.md` |
| Commit owner | Kevin Stiven Lopez Amaya |
| Pull request title | `feat(iam): add password recovery flow (HU-IAM-014)` |
| Status | Ready for QA re-review |

## QA Requested Fixes

QA rejected the story because of visual design and pull request governance
issues. The required fixes have been applied.

### Visual Design Fixes

| QA finding | Applied fix |
| --- | --- |
| The recovery form card was too wide compared with the mockup. | The shared authentication card width was reduced from `576px` to `448px` through `--auth-card-width`. |
| The **Volver a ingresar** button used a green border and text, competing with the primary action. | The secondary button now uses a neutral dark gray/blue style: `#344054`, with hover state `#1f2937` and background `#f8fafc`. |

The `/forgot-password` screen now shows:

- **Correo** field.
- Primary **Enviar enlace** button.
- Secondary **Volver a ingresar** button with neutral styling.

The **Volver a ingresar** button navigates back to `/login` without changing
the reset request flow or the generic confirmation message.

### Pull Request Governance Fixes

| QA finding | Applied fix |
| --- | --- |
| PR title did not follow the semantic convention. | The PR title was updated to `feat(iam): add password recovery flow (HU-IAM-014)`. |
| PR description did not clearly detail the implementation and fixes. | The PR description was updated in English with summary, validation evidence, QA documentation link, and branch information. |

## Scope and Contract

| Flow | Endpoint | Expected result |
| --- | --- | --- |
| Request password recovery | `POST /auth/password-reset/request` | Generic confirmation without revealing whether the user exists |
| Confirm new password | `POST /auth/password-reset/confirm` | Navigation to login with a success message |
| Invalid or expired token | `POST /auth/password-reset/confirm` | Error message and option to request a new link |

Scope notes:

- The request form accepts an email address.
- The request message must remain generic and must not reveal whether the
  account exists.
- Password policy requires at least 10 characters, one uppercase letter, one
  lowercase letter, one number, and one symbol.
- Forced redirection for temporary password or first login belongs to the
  shell-host. This MFE validates the target screen and reset flow.

## QA Dependencies

| Dependency | Impact |
| --- | --- |
| IAM backend available | Required to validate real endpoint integration |
| Controlled QA account | Required to test reset requests without real personal data |
| Valid, expired, or used tokens | Required to validate confirmation and token error scenarios |
| Shell-host | Required only to validate forced temporary-password redirection |

If the IAM backend is not available, automated tests still pass because they
mock HTTP responses. They do not replace a real end-to-end integration test.

## Modified Files

| File | Change |
| --- | --- |
| [`src/adapter/in/pages/RequestPasswordResetScreen.tsx`](https://github.com/code-sena/design-software-iam-mfe/blob/hu-014-dev/src/adapter/in/pages/RequestPasswordResetScreen.tsx) | Adds the **Volver a ingresar** button |
| [`src/styles.css`](https://github.com/code-sena/design-software-iam-mfe/blob/hu-014-dev/src/styles.css) | Reduces the auth card width and updates the secondary button neutral styling |
| [`tests/integration/PasswordResetFlow.test.tsx`](https://github.com/code-sena/design-software-iam-mfe/blob/hu-014-dev/tests/integration/PasswordResetFlow.test.tsx) | Validates button presence and navigation back to login |

## Quick Review Guide

1. Open the review branch:

```text
https://github.com/code-sena/design-software-iam-mfe/tree/hu-014-dev
```

2. Install dependencies if they are not available locally:

```bash
npm install
```

3. Start the MFE:

```bash
npm run dev
```

4. Open the route:

```text
/forgot-password
```

5. Confirm the recovery card is compact and centered.

6. Confirm the secondary **Volver a ingresar** button uses neutral dark
   gray/blue styling, not green.

7. Click **Volver a ingresar** and confirm it navigates to:

```text
/login
```

## Suggested Test Cases

| ID | Scenario | Steps | Expected result |
| --- | --- | --- | --- |
| QA-014-01 | Open recovery from login | Open `/login` and select the forgot-password action | `/forgot-password` is displayed |
| QA-014-02 | Validate compact card width | Open `/forgot-password` on desktop | The card is compact, centered, and no longer uses the previous wide `576px` layout |
| QA-014-03 | Validate secondary button style | Open `/forgot-password` | **Volver a ingresar** uses neutral dark gray/blue text and border |
| QA-014-04 | Return to login | Click **Volver a ingresar** | The app navigates to `/login` |
| QA-014-05 | Required email | Try to submit empty or invalid email format | Browser validation blocks submission and no endpoint call is made |
| QA-014-06 | Accepted reset request | Enter a QA email and submit | `POST /auth/password-reset/request` is called and a generic confirmation is shown |
| QA-014-07 | Automatic redirect | Complete an accepted request and wait about 3 seconds | The app redirects to `/login` |
| QA-014-08 | Request error | Simulate backend failure | A safe error message is shown and retry is possible |
| QA-014-09 | Missing token | Open `/reset-password` without token | Save is blocked and requesting a new link is available |
| QA-014-10 | Password policy | Try invalid passwords and then a valid one | Submit is enabled only when every rule is met |
| QA-014-11 | Different confirmation | Enter a valid password and different confirmation | A mismatch error is shown |
| QA-014-12 | Successful confirmation | Use a valid token and valid password | `POST /auth/password-reset/confirm` is called and the app returns to login with success |
| QA-014-13 | Invalid or expired token | Confirm with an expired/used token | Error is shown and requesting a new link is possible |

## Automated Validation Executed

| Validation | Result |
| --- | --- |
| `npm.cmd test` | Passed - 20 tests green |
| `npm.cmd run typecheck` | Passed |
| `npm.cmd run lint` | Passed |
| `npm.cmd run build` | Passed |

Equivalent commands:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

## Recommended QA Evidence

For each case, record:

- Status: Passed, Failed, Blocked, or Not applicable.
- Date, environment, and tested commit.
- Screenshot with sensitive data hidden.
- HTTP status and request/response body when applicable, hiding real email
  addresses, tokens, and passwords.
- Concrete dependency if the case is blocked.

## Exit Criteria

The story can be approved when:

- The password recovery card matches the compact visual design.
- The **Volver a ingresar** secondary button uses neutral dark gray/blue styling.
- The **Volver a ingresar** button returns to `/login`.
- The reset request keeps a generic confirmation and does not reveal whether
  the user exists.
- The new password is saved only with a valid token and compliant password.
- Request or token errors show safe messages and allow the user to continue the
  flow.
- The PR title and description follow the team governance convention.
