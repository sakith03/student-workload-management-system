@api @deactivation
Feature: Workspace Deactivation via API
  As a workspace owner
  I want to delete a workspace
  So that it is removed from the system

  Scenario: Owner can successfully deactivate a workspace
    Given I have an active workspace named "To Be Deleted" with max members 4
    When I delete the workspace
    Then the API should return status 204

  Scenario: Deleted workspace is no longer accessible
    Given I have an active workspace named "Gone Soon" with max members 4
    When I delete the workspace
    Then the API should return status 204
    When I try to fetch the workspace
    Then the API should return status 404

  Scenario: A non-owner cannot delete the workspace
    Given I have an active workspace named "Protected Workspace" with max members 4
    And a second user who is not the workspace owner
    When the second user tries to delete the workspace
    Then the API should return status 403

  Scenario: Fetching a non-existent workspace returns 404
    When I try to fetch a workspace with a random non-existent ID
    Then the API should return status 404