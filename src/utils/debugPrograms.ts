import { DebugProgram } from '../types/game';

// Each program has exactly one bug. The fixed version's output is a 4-digit key.
// Run `npm run verify:debug` to prove every program is solvable with real Python.
export const DEBUG_PROGRAMS: DebugProgram[] = [
  {
    id: 'sensor-calibration',
    title: "Subroutine 01: Sensor Calibration Filter (Python)",
    description: "Discard out-of-range sensor readings, then compute the weighted checksum that forms the 4-digit key.",
    bugType: 'logic',
    expectedOutput: '7695',
    requiredSnippets: ["def filter_readings", "def checksum"],
    hint1: "The filtered list only ever contains one reading. Check where the function returns.",
    hint2: "'return valid' is indented inside the for loop, so it exits after the first reading. Move it back one level (align with 'for').",
    buggyCode: `# Sensor Calibration Filter
# Keep only readings inside the safe range, then build a weighted checksum.

def filter_readings(readings, low, high):
    valid = []
    for r in readings:
        if low <= r <= high:
            valid.append(r)
        return valid

def checksum(values):
    total = 0
    for i, v in enumerate(values, start=1):
        total += v * i
    return total

raw = [412, 95, 380, 1200, 275, 33, 340, 510, 2000, 298]
clean = filter_readings(raw, 100, 600)
print(checksum(clean))`,
  },
  {
    id: 'log-analyzer',
    title: "Subroutine 02: Intrusion Log Analyzer (Python)",
    description: "Scan the security log, add up the severity codes of every ERROR line and build the 4-digit key.",
    bugType: 'syntax',
    expectedOutput: '1074',
    requiredSnippets: ["def error_score", ".split()"],
    hint1: "Python refuses to run this file at all. Read the SyntaxError line number carefully.",
    hint2: "In the if statement, '=' assigns a value. Comparing two values needs '=='.",
    buggyCode: `# Intrusion Log Analyzer
# Each ERROR line ends with a severity number. Sum them and count the errors.

logs = [
    "INFO boot sequence ok",
    "ERROR disk sector 7",
    "WARN fan speed low",
    "ERROR net timeout 12",
    "INFO user login",
    "ERROR cpu temp 85",
    "ERROR auth failed 3",
    "WARN battery 40",
]

def error_score(lines):
    score = 0
    count = 0
    for line in lines:
        parts = line.split()
        if parts[0] = "ERROR":
            score += int(parts[-1])
            count += 1
    return score * 10 + count

print(error_score(logs))`,
  },
  {
    id: 'vault-locator',
    title: "Subroutine 03: Vault Record Locator (Python)",
    description: "Binary-search the sorted vault IDs. The number of steps and the record position form the 4-digit key.",
    bugType: 'runtime',
    expectedOutput: '3332',
    requiredSnippets: ["def locate", "while low <= high"],
    hint1: "The program crashes with a TypeError about list indices. Which variable is not a whole number?",
    hint2: "'/' always returns a decimal number in Python 3. Use '//' for integer division when computing mid.",
    buggyCode: `# Vault Record Locator (binary search)
# The ID list is sorted, so we can halve the search area each step.

def locate(sorted_ids, target):
    low = 0
    high = len(sorted_ids) - 1
    steps = 0
    while low <= high:
        steps += 1
        mid = (low + high) / 2
        if sorted_ids[mid] == target:
            return mid, steps
        elif sorted_ids[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1, steps

ids = [104, 215, 387, 421, 560, 678, 733, 849, 912, 1005,
       1190, 1342, 1477, 1590, 1721, 1888]

position, steps = locate(ids, 1342)
print(steps * 1000 + (position + 1) * 111)`,
  },
  {
    id: 'ledger-audit',
    title: "Subroutine 04: Ledger Reconciliation (Python)",
    description: "Replay the bank ledger from the opening balance. The closing balance is the 4-digit key.",
    bugType: 'logic',
    expectedOutput: '3605',
    requiredSnippets: ["def reconcile"],
    hint1: "Deposits work, but after a withdrawal the balance looks wrong. Compare the two update lines closely.",
    hint2: "'balance =- amount' means balance = (-amount). To subtract from the balance, write 'balance -= amount'.",
    buggyCode: `# Ledger Reconciliation
# D = deposit, W = withdrawal. Start from the opening balance.

transactions = [
    ("D", 1500), ("W", 320), ("D", 870), ("W", 150),
    ("W", 410), ("D", 2250), ("W", 975), ("D", 640),
]

def reconcile(entries, opening):
    balance = opening
    for kind, amount in entries:
        if kind == "D":
            balance += amount
        elif kind == "W":
            balance =- amount
    return balance

print(reconcile(transactions, 200))`,
  },
  {
    id: 'prime-key',
    title: "Subroutine 05: Prime Key Generator (Python)",
    description: "Add every prime number below 100. The total is the 4-digit key.",
    bugType: 'logic',
    expectedOutput: '1060',
    requiredSnippets: ["def is_prime", "def prime_key"],
    hint1: "Numbers like 9, 25 and 49 are being treated as prime. Look at how far the divisor loop checks.",
    hint2: "range(2, int(n ** 0.5)) stops one short, so perfect squares slip through. Use range(2, int(n ** 0.5) + 1).",
    buggyCode: `# Prime Key Generator
# A number is prime if no divisor from 2 up to its square root divides it.

def is_prime(n):
    if n < 2:
        return False
    for d in range(2, int(n ** 0.5)):
        if n % d == 0:
            return False
    return True

def prime_key(limit):
    total = 0
    for n in range(2, limit):
        if is_prime(n):
            total += n
    return total

print(prime_key(100))`,
  },
  {
    id: 'gear-sync',
    title: "Subroutine 06: Gear Synchronizer (Python)",
    description: "Find when each gear pair realigns (their LCM). Triple the sum of all pairs for the 4-digit key.",
    bugType: 'logic',
    expectedOutput: '1419',
    requiredSnippets: ["def gcd", "def lcm"],
    hint1: "The greatest common divisor is wrong. Trace 'a' and 'b' by hand for gcd(12, 18) inside the loop.",
    hint2: "After 'a = b', the old value of a is lost, so 'b = a % b' uses the wrong number. Use the tuple swap: a, b = b, a % b.",
    buggyCode: `# Gear Synchronizer
# Two gears realign after lcm(a, b) = a * b / gcd(a, b) teeth.

def gcd(a, b):
    while b != 0:
        a = b
        b = a % b
    return a

def lcm(a, b):
    return a * b // gcd(a, b)

gears = [(12, 18), (21, 6), (35, 14), (40, 28), (9, 15)]
total = 0
for x, y in gears:
    total += lcm(x, y)

print(total * 3)`,
  },
  {
    id: 'route-planner',
    title: "Subroutine 07: Cheapest Route Planner (Python)",
    description: "Find the cheapest path from the top-left to the bottom-right of the cost grid (moving right or down).",
    bugType: 'syntax',
    expectedOutput: '5140',
    requiredSnippets: ["def cheapest_route", "min("],
    hint1: "Python says a bracket was never closed or the syntax is invalid. The real mistake is usually just above the reported line.",
    hint2: "The third row of 'grid' is missing its closing bracket ']' after 570.",
    buggyCode: `# Cheapest Route Planner (dynamic programming)
# best[r][c] holds the cheapest cost to reach cell (r, c).

grid = [
    [1310, 180, 2380, 290],
    [470, 2020, 610, 1440],
    [930, 260, 1150, 570
    [380, 1740, 220, 800],
]

def cheapest_route(cost):
    rows, cols = len(cost), len(cost[0])
    best = [[0] * cols for _ in range(rows)]
    best[0][0] = cost[0][0]
    for c in range(1, cols):
        best[0][c] = best[0][c - 1] + cost[0][c]
    for r in range(1, rows):
        best[r][0] = best[r - 1][0] + cost[r][0]
    for r in range(1, rows):
        for c in range(1, cols):
            best[r][c] = cost[r][c] + min(best[r - 1][c], best[r][c - 1])
    return best[rows - 1][cols - 1]

print(cheapest_route(grid))`,
  },
  {
    id: 'vault-inventory',
    title: "Subroutine 08: Vault Inventory Manager (Python)",
    description: "Register items in the vault object. Total value plus the most valuable item forms the 4-digit key.",
    bugType: 'runtime',
    expectedOutput: '3995',
    requiredSnippets: ["class Vault", "def total_value"],
    hint1: "TypeError: the method received more arguments than expected. Check how the first parameter of a method is written.",
    hint2: "Every method inside a class needs 'self' as its first parameter. Change it to: def add_item(self, label, value):",
    buggyCode: `# Vault Inventory Manager (object-oriented)

class Vault:
    def __init__(self, name):
        self.name = name
        self.items = []

    def add_item(label, value):
        self.items.append((label, value))

    def total_value(self):
        return sum(v for _, v in self.items)

    def most_valuable(self):
        return max(self.items, key=lambda it: it[1])

vault = Vault("Floor 13")
vault.add_item("ledger", 420)
vault.add_item("keycard", 1350)
vault.add_item("drive", 780)
vault.add_item("badge", 95)

top = vault.most_valuable()
print(vault.total_value() + top[1])`,
  },
];

export function getRandomDebugProgram(excludeId?: string): DebugProgram {
  const pool = excludeId ? DEBUG_PROGRAMS.filter(p => p.id !== excludeId) : DEBUG_PROGRAMS;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}
