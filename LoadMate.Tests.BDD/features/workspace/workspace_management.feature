@api
Feature: Workspace Management via API
  As a student I want to create update and delete workspaces
  So that I can manage my study groups

  # CREATION — 5 scenarios

  Scenario: Create a workspace with default settings
    When I create a workspace with name "Team Alpha" and description "Our study group"
    Then the API should return status 201
    And the response should contain a workspace ID
    And the response should contain an invite code of exactly 6 characters

  Scenario: Create a workspace with custom max members
    When I create a workspace with name "Project Beta" description "Research team" and max members 8
    Then the API should return status 201
    And the response should contain a workspace ID

  Scenario: Invite code uses only safe characters
    When I create a workspace with name "Safe Code Test" and description "Charset check"
    Then the API should return status 201
    And the invite code should only contain allowed characters
    And the invite code should not contain confusable characters I O or 1

  Scenario: Cannot create a workspace with an empty name
    When I try to create a workspace with an empty name
    Then the workspace creation should fail with a non-success response

  Scenario: Cannot create a workspace when not authenticated
    When I try to create a workspace without a token
    Then the API should return status 401

  # UPDATE — 4 scenarios

  Scenario: Successfully update workspace details
    Given I have an active workspace named "Original Name" with max members 6
    When I update the workspace name to "Updated Name" description "New Desc" and max members 8
    Then the API should return status 200
    And the response name should be "Updated Name"
    And the response max members should be 8

  Scenario: Workspace name is trimmed on update
    Given I have an active workspace named "Original Name" with max members 6
    When I update the workspace name to "  Trimmed Name  " description "Test" and max members 6
    Then the API should return status 200
    And the response name should be "Trimmed Name"

  Scenario: Cannot update workspace to an empty name
    Given I have an active workspace named "Original Name" with max members 6
    When I try to update the workspace name to "" and max members 6
    Then the API should return status 400
    And the error message should contain "Group name is required"

  Scenario: Non-owner cannot update the workspace
    Given I have an active workspace named "Original Name" with max members 6
    And a second user who is not the workspace owner
    When the second user tries to update the workspace name to "Hacked Name" and max members 5
    Then the API should return status 403

  # DELETE — 3 scenarios

  Scenario: Owner can delete a workspace
    Given I have an active workspace named "To Be Deleted" with max members 4
    When I delete the workspace
    Then the API should return status 204

  Scenario: Deleted workspace returns 404 on fetch
    Given I have an active workspace named "Gone Soon" with max members 4
    When I delete the workspace
    Then the API should return status 204
    When I try to fetch the workspace
    Then the API should return status 404

  Scenario: Non-owner cannot delete the workspace
    Given I have an active workspace named "Protected" with max members 4
    And a second user who is not the workspace owner
    When the second user tries to delete the workspace
    Then the API should return status 403