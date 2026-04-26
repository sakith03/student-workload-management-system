@ui 
Feature: Authentication (Login)
  As a registered user
  I want to log in securely
  So that I can access protected pages

  @smoke @happy
  Scenario: Successful login redirects to dashboard
    Given a registered user exists
    When the user logs in with valid credentials
    Then the user should be redirected to "/dashboard"
    And the top bar should show the user's email

  @negative
  Scenario Outline: Invalid credentials show a clear error
    When the user attempts to log in with email "<email>" and password "<password>"
    Then the user should remain on "/login"
    And the user should not have a JWT token stored

    Examples:
      | email                  | password    |
      | user@university.edu    | wrongpass   |
      | someone@university.edu | Password!1  |

  @negative @validation
  Scenario Outline: Client-side validation prevents invalid form submission
    Given the user is on the login page
    When the user attempts to submit the login form with email "<email>" and password "<password>"
    Then the user should remain on "/login"

    Examples:
      | email         | password   |
      | not-an-email  | anything   |
      |               | Password!1 |
      | user@uni.edu  |            |

  @security
  Scenario: Protected route redirects to login when not authenticated
    Given the user is not authenticated
    When the user navigates to "/dashboard"
    Then the user should be redirected to "/login"

