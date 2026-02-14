# Page-Fit Agent Notes

## Weighted Proportional Shrinking

The shrink knob `t` goes from 0 (no shrinking) to 1 (everything at minimums). Each variable category has a power exponent that controls how fast it responds to `t`:

| Category   | Variables                                                | Power |
| ---------- | -------------------------------------------------------- | ----- |
| Spacing    | `bullet-gap`, `data-row-gap`, `entry-gap`, `section-gap` | 0.5   |
| Margins    | `page-margin-x`, `page-margin-y`                         | 1.0   |
| Typography | `font-size`, `line-height`                               | 2.0   |

### Interpolation

```
effective_t = t ^ power
value = original - effective_t * (original - minimum)
```

### Behavior at t = 0.5

- Spacing: 71% toward minimum (`0.5^0.5`)
- Margins: 50% toward minimum (`0.5^1.0`)
- Typography: 25% toward minimum (`0.5^2.0`)

A small overflow tightens gaps without touching font size. Font size only drops significantly for severe overflows.
