@creation
Feature: Workspace Creation via API
  As a student
  I want to create a study workspace (group)
  So that I can collaborate with classmates on a subject

  # ── Happy Path ────────────────────────────────────────────────────────────────

  Scenario: Successfully create a workspace with default max members
    When I create a workspace with name "Team Alpha" and description "Our study group"
    Then the API should return status 201
    And the response should contain a workspace ID
    And the response should contain an invite code of exactly 6 characters

  Scenario: Successfully create a workspace with custom max members
    When I create a workspace with name "Project Beta" description "Research team" and max members 8
    Then the API should return status 201
    And the response should contain a workspace ID

  Scenario: Invite code only uses the safe character set
    When I create a workspace with name "Safe Code Test" and description "Checking invite code charset"
    Then the API should return status 201
    And the invite code should only contain allowed characters
    And the invite code should not contain confusable characters I O or 1

  Scenario: Successfully create a workspace at the minimum max members boundary
    When I create a workspace with name "Min Boundary" description "Pair team" and max members 2
    Then the API should return status 201

  Scenario: Successfully create a workspace at the maximum max members boundary
    When I create a workspace with name "Max Boundary" description "Full team" and max members 10
    Then the API should return status 201

  # ── Validation Edge Cases ─────────────────────────────────────────────────────

  Scenario: Cannot create a workspace with an empty name
    When I try to create a workspace with an empty name
    Then the workspace creation should fail with a non-success response

  Scenario: Cannot create a workspace with a whitespace-only name
    When I try to create a workspace with name "     "
    Then the workspace creation should fail with a non-success response

  Scenario Outline: Cannot create a workspace with an invalid number of max members
    When I try to create a workspace with max members set to 
    Then the workspace creation should fail with a non-success response

    Examples:
      | maxMembers |
      | 0          |
      | 1          |
      | 11         |
      | 100        |
      | -5         |

  Scenario: Cannot create a workspace when not authenticated
    When I try to create a workspace without a token
    Then the API should return status 401