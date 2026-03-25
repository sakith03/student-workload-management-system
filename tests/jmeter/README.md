# LoadMate — JMeter Test Suite

## Prerequisites
- Apache JMeter 5.6.3+
- Java 8+
- MSSQL JDBC driver in `jmeter/lib/`
- LoadMate backend running on `http://localhost:5000`

## Before Every Test Run
1. Clean up your local DB
2. Ensure the backend is running: `docker compose up -d`

## Running via GUI
```bash
cd apache-jmeter-5.6.3/bin
./jmeter.sh
# File → Open → select loadmate_invitation_flow.jmx
# Press the green Play button
```

## Running via CLI (headless)
```bash
jmeter -n \
  -t tests/jmeter/loadmate_invitation_flow.jmx \
  -l tests/jmeter/results/results.jtl \
  -e -o tests/jmeter/results/html-report/
```

## Test Scenarios Covered
| # | Scenario | Type |
|---|---|---|
| 1 | Full invitation happy path | Functional |
| 2 | Invalid token | Negative |
| 3 | Expired token | Negative |
| 4 | Unauthorized accept | Negative |
| 5 | Accept twice (idempotent) | Edge Case |

## Notes
- The JDBC sampler reads the invite token directly from the DB
- Test emails: `inviter_test@university.edu` / `invitee_test@university.edu`