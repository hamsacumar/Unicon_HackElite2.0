using Microsoft.AspNetCore.Mvc;

namespace UniversityApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        // GET api/settings/help
        [HttpGet("help")]
        public IActionResult GetHelp()
        {
            var text = @"
Welcome to the University App Help Center!
This guide helps Students, Organizers, and Admins use the app effectively.

--------------------------------------------------
1. Students
--------------------------------------------------
Purpose: Find university events, competitions, seminars, and submission deadlines.

How to use the app:
• Explore Events: Browse competitions, seminars, research opportunities, and promotions.
• Interact: Like, comment, and share posts.
• Notifications: Enable notifications to get reminders for deadlines, submissions, or new posts.
• Profile Management: Update your profile, upload a profile picture, and set your interests.
• Submitting Work: For competitions or assignments, click on the event and submit the required files before the deadline.

--------------------------------------------------
2. Organizers (Companies)
--------------------------------------------------
Purpose: Post events, manage submissions, and communicate with students.

How to use the app:
• Create Account: Register as an Organizer to access posting privileges.
• Create Events/Posts: Click on 'Create Event' and fill in details like title, description, deadline, and eligibility.
• Manage Submissions: View student submissions, download files, and provide feedback.
• Notifications: Receive reminders for deadlines and updates from students.
• Subscriptions: Students can subscribe to your posts; you can see engagement and comments.

--------------------------------------------------
3. Admins
--------------------------------------------------
Purpose: Manage users, posts, notifications, and maintain the system.

How to use the app:
• User Management: Approve or block students and organizers, reset passwords.
• Post Monitoring: Review posts, remove inappropriate content.
• Notifications: Send announcements or notifications to all users.
• Reports: Track event participation, user engagement, and submissions.

--------------------------------------------------
4. Common Tips
--------------------------------------------------
• Navigation: Use the bottom tabs or side menu to move between Home, Profile, Messages, and Settings.
• Logout: Always use the Logout button in Settings to secure your account.
• Support Contact: If you face any issues, email support@universityapp.edu with your username and role.
";

            return Ok(new { content = text });
        }

        [HttpGet("terms")]
        public IActionResult GetTerms()
        {
            var text = @"
Terms & Policies:

By using this app, you agree to follow university regulations, respect privacy, and not misuse the platform.
The app collects data necessary for notifications, submissions, and communication between students and organizers.
For full details, visit our official university website.";
            return Ok(new { content = text });
        }

        [HttpGet("about")]
        public IActionResult GetAbout()
        {
            var text = @"
About:

This app connects university students with competitions, seminars, interviews, submissions, promotions, research opportunities, and more.
Students can view posts, like, comment, and receive notifications.
Organizers can post events and manage submissions.
Our goal is to make university opportunities accessible to everyone in one platform.";
            return Ok(new { content = text });
        }
    }
}
