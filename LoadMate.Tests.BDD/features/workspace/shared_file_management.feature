@api
Feature: Shared File Management via API
  As a workspace member I want to share files
  So that my team can access important documents

  Background:
    Given I have an active workspace named "File Test Workspace" with max members 6

  # HAPPY PATH — 3 scenarios

  Scenario: Successfully upload a file to a workspace
    When I upload a file named "assignment.pdf" with content type "application/pdf"
    Then the API should return status 200
    And the response should contain the uploaded file ID
    And the response file name should be "assignment.pdf"

  Scenario: Successfully list files in a workspace
    Given I have already uploaded a file named "notes.txt" to the workspace
    When I request the file list for the workspace
    Then the API should return status 200
    And the file list should contain at least 1 file

  Scenario: Successfully download an uploaded file
    Given I have already uploaded a file named "download_me.pdf" to the workspace
    When I download the uploaded file
    Then the API should return status 200

  # EDGE CASES — 3 scenarios

  Scenario: Cannot upload when no file is provided
    When I try to upload without providing a file
    Then the API should return status 400
    And the error message should contain "File is required"

  Scenario: Non-member cannot upload files
    Given a second user who is not the workspace owner
    When the second user tries to upload a file to the workspace
    Then the API should return status 403

  Scenario: Non-member cannot list files
    Given a second user who is not the workspace owner
    When the second user tries to list files in the workspace
    Then the API should return status 403