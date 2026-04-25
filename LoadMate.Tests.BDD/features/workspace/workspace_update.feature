@update
Feature: Workspace Update via API
  As a workspace owner
  I want to update workspace details
  So that project information stays accurate

  Background:
    Given I have an active workspace named "Original Name" with max members 6

  # ── Happy Path ────────────────────────────────────────────────────────────────

  Scenario: Successfully update all workspace details
    When I update the workspace name to "Updated Name" description "New Desc" and max members 8
    Then the API should return status 200
    And the response name should be "Updated Name"
    And the response max members should be 8

  Scenario: Successfully update only the name
    When I update the workspace name to "Renamed Team" description "Same Desc" and max members 6
    Then the API should return status 200
    And the response name should be "Renamed Team"

  Scenario: Updated workspace name is trimmed of surrounding whitespace
    When I update the workspace name to "  Trimmed Name  " description "Test" and max members 6
    Then the API should return status 200
    And the response name should be "Trimmed Name"

  # ── Validation Errors (correctly returns 400) ─────────────────────────────────

  Scenario: Cannot update a workspace to have an empty name
    When I try to update the workspace name to "" and max members 6
    Then the API should return status 400
    And the error message should contain "Group name is required"

  Scenario: Cannot update a workspace to have a whitespace-only name
    When I try to update the workspace name to "   " and max members 6
    Then the API should return status 400
    And the error message should contain "Group name is required"

  Scenario Outline: Cannot update workspace to invalid max members
    When I try to update the workspace name to "Valid Name" and max members 
    Then the API should return status 400
    And the error message should contain "Max members must be between 2 and 10"

    Examples:
      | maxMembers |
      | 0          |
      | 1          |
      | 11         |
      | -3         |

  # ── Authorization ─────────────────────────────────────────────────────────────

  Scenario: A non-owner cannot update the workspace
    Given a second user who is not the workspace owner
    When the second user tries to update the workspace name to "Hacked Name" and max members 5
    Then the API should return status 403