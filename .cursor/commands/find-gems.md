# Find Hidden Gems

Find "I had no idea about this" moments in any codebase that would surprise experienced engineers.

---

## What Makes a Great Discovery

| ✅ Look For                                                               | ❌ Avoid                                 |
| ------------------------------------------------------------------------- | ---------------------------------------- |
| Magic numbers with meaning (constants that spell words, π-derived values) | Well-known patterns (singleton, factory) |
| Defensive code with personality (comments explaining "why", past bugs)    | Generic optimizations                    |
| Intentional limitations (code that restricts to prevent misuse)           | Complex code that's just complex         |
| Lock-free / wait-free patterns (rotating buffers, atomic swaps)           | Features in official docs                |
| Memory layout tricks (struct packing, cache-line alignment)               | Anything needing 20 min of context       |
| Historical artifacts (code from bugs 10 years ago)                        |                                          |

## Quick Scan Commands

```bash
# Comments with stories
rg -n "NOTE:|HACK:|XXX:|SAFETY:|careful|subtle|tricky" --type c --type go --type rust | head -50

# Magic constants
rg -n "0x[0-9A-Fa-f]{6,}" --type c --type h | head -30

# Concurrency tricks
rg -n "atomic|barrier|volatile|lock.free" --type c --type go | head -30

# Oldest surviving code
git log --diff-filter=A --reverse --format="%h %s" -- "*.c" "*.go" | head -20

# Most-edited files
git log --pretty=format: --name-only | sort | uniq -c | sort -rn | head -20
```

## Evaluate Each Candidate

Must answer YES to all:

1. Would a senior engineer with 10+ years experience be surprised?
2. Is there a "villain"? (A bug, attack, or constraint that drove this design)
3. Can you explain it in 5 minutes?
4. Does it teach something applicable to other projects?

## Output Format

For each discovery (find 3-5):

```
## [Catchy Title] ⭐⭐⭐⭐☆

**File:** `path/to/file:line`
**Hook:** [One sentence that would make someone click]

### The Code
[Show 10-50 lines]

### Why It's Interesting
[2-3 paragraphs: what it does, why it's surprising, what problem it solves]

### The Lesson
[Broader takeaway any developer can use]

### Backstory
- Git blame: [commit hash]
- Related: [issues/discussions if found]
```

---

**Repository:** [paste repo path or URL]

**Focus area (optional):** [e.g., "networking", "memory management"]
