# Changelog

## [0.7.0-beta.1](https://github.com/drinkyouroj/intakeform-ai/compare/v0.6.0-beta.1...v0.7.0-beta.1) (2026-03-22)


### Features

* **ai:** add retry with exponential backoff to eval runner ([a4d3fb3](https://github.com/drinkyouroj/intakeform-ai/commit/a4d3fb3a81b7b5ac5305c673d573283c0642f0a0))
* **dashboard:** add form delete, intakes actions, and template-based form creation ([12dbb3a](https://github.com/drinkyouroj/intakeform-ai/commit/12dbb3ab67478dae20766e1dc627e1e0269b2ede))
* **dashboard:** add settings page with account, billing, notifications, embed tabs ([3750c1a](https://github.com/drinkyouroj/intakeform-ai/commit/3750c1a6a21a630b61266841436739a0de42f889))
* **dashboard:** form delete, intakes actions, template picker ([326cc33](https://github.com/drinkyouroj/intakeform-ai/commit/326cc33981577d16aff280275ac19804f911ac8d))
* **intake-form:** add question reset and session reset with AI re-evaluation ([1da3cd0](https://github.com/drinkyouroj/intakeform-ai/commit/1da3cd0800bb5cd703cd9e99d2bd3db39e01bda0))
* **intake-form:** auto-submit multiselect when focus leaves the question ([5642284](https://github.com/drinkyouroj/intakeform-ai/commit/564228458893da2f6e7c739400e0b7b165836593))
* **intake-form:** lock question inputs after answer submission ([4170b27](https://github.com/drinkyouroj/intakeform-ai/commit/4170b273100efe010e86471e60a26a4bedff6dd6))


### Bug Fixes

* **ai:** fix eval runner dirname bug and improve JSON parser robustness ([344929b](https://github.com/drinkyouroj/intakeform-ai/commit/344929bff694edd77b7cec47be41d5960b213a49))
* **dashboard:** add /dashboard/forms/new route for creating blank forms ([7d694da](https://github.com/drinkyouroj/intakeform-ai/commit/7d694daad8ddcba5a991820b78b6945d25aee496))
* **dashboard:** delete form's sessions/briefs/generations before form to avoid FK violation ([b4b91ef](https://github.com/drinkyouroj/intakeform-ai/commit/b4b91ef682ec54559407d944ab6475cedae817cb))
* **dashboard:** use onClick instead of onSelect for Base UI dropdown menu items ([22d2be7](https://github.com/drinkyouroj/intakeform-ai/commit/22d2be77ec5f53e855f71a8103e05a263dc84ad9))
* **intake-form:** add confirm step for multiselect before locking ([96fe5ad](https://github.com/drinkyouroj/intakeform-ai/commit/96fe5adc697c05b0726eddf81500d19bb8e1266b))
* **intake-form:** fix follow-up answer targeting and duplicate submission bugs ([87dbf98](https://github.com/drinkyouroj/intakeform-ai/commit/87dbf98f5492ca7f95dd855ac05e304471b45f3e))
* **intake-form:** prevent multiselect from locking after second checkbox click ([873cc92](https://github.com/drinkyouroj/intakeform-ai/commit/873cc92777e540967f37ad5169378c3e76f0ac6a))
* **intake-form:** prevent multiselect label clicks from triggering premature lock ([4237f5b](https://github.com/drinkyouroj/intakeform-ai/commit/4237f5b10f3f04b5cac2319c1e853ab23eba101f))
* resolve merge conflict in forms/new page — keep template picker over auto-create ([923f8b5](https://github.com/drinkyouroj/intakeform-ai/commit/923f8b5bdf0515f37bb17e15202d9fcf567fb89c))
* **security:** add ownership checks to activateForm and markBriefReviewed ([26ccc98](https://github.com/drinkyouroj/intakeform-ai/commit/26ccc9899b26d9adfae028c2ceafe4746f5e64c8))
* **session:** return correct version after AI follow-up generation ([bf02b61](https://github.com/drinkyouroj/intakeform-ai/commit/bf02b61b6fb6c46d0bae48b751b5d6d8d3ca1818))
