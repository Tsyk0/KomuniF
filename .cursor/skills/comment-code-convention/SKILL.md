---
name: comment-code-convention
description: Enforce explicit code comments for new methods, classes, and non-obvious variables. Use when generating or refactoring code that should include "function + scenario" comments and variable-purpose annotations.
---

# Comment Code Convention

## Purpose

Apply a consistent annotation style when writing new code so reviewers can quickly understand **what it does** and **where/why it is used**.

## When To Use

- User asks for stricter code annotation standards.
- New methods or classes are introduced.
- Complex or non-intuitive variable names appear.
- Business logic is non-trivial and needs context for maintainability.

## Rules

### 1) Method comments (required)

Before every newly generated method/function, add a concise comment block including:

- Functionality: what the method does.
- Scenario: where/when the method should be used.

Template:

```ts
/**
 * <方法功能说明>
 * 使用场景：<该方法在什么流程或页面中被调用>
 */
```

### 2) Class comments (required)

Before every newly generated class, add a concise comment block including:

- Class responsibility.
- Typical usage scenario.

Template:

```ts
/**
 * <类的职责说明>
 * 使用场景：<在哪个业务域或流程中使用>
 */
class ExampleClass {}
```

### 3) Variable comments (conditional but mandatory for non-obvious names)

If a variable name is not self-evident or belongs to complex business flow, add an inline comment immediately above declaration including:

- Variable purpose.
- Which method/class uses it.

Template:

```ts
/** <变量作用>；用于 <方法名/类名> */
const stagedAvatarPreviewUrl = ref("");
```

## Scope Control

- Prefer concise comments (1-2 lines), avoid obvious commentary.
- Do not rewrite existing clear comments unless they are inaccurate.
- Keep terminology consistent with project naming.

## Quick Checklist

- [ ] Every new method has "功能 + 使用场景" comment.
- [ ] Every new class has "职责 + 使用场景" comment.
- [ ] Every non-obvious variable has "作用 + 使用位置" comment.
- [ ] Comments match actual behavior after final edits.
