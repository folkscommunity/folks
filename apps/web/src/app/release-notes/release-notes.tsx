import dayjs from "dayjs";

import { parsePostBody } from "@/lib/post-utils";

export const current_release = "0.9.9";

const releases = [
  {
    version: "0.9.9",
    date: "2025-05-28",
    changes: ["Added the ability to delete your account."]
  },
  {
    version: "0.9.8",
    date: "2025-05-26",
    changes: [
      "Added block user functionality.",
      "Improved timeline image gallery."
    ]
  },
  {
    version: "0.9.7",
    date: "2025-05-23",
    changes: ["Fix feed refresh on post."]
  },
  {
    version: "0.9.6",
    date: "2025-05-11",
    changes: ["More support for mobile app.", "Added alt text to images."]
  },
  {
    version: "0.9.5",
    date: "2025-04-16",
    changes: [
      "Added a public roadmap.",
      "Added an announcement banner.",
      "Fixed a bug with the notifications on PWA's."
    ]
  },
  {
    version: "0.9.4",
    date: "2025-04-13",
    changes: ["Admin tool to resend verify emails."]
  },
  {
    version: "0.9.3",
    date: "2025-03-30",
    changes: ["Fixed the reply composer."]
  },
  {
    version: "0.9.2",
    date: "2025-03-28",
    changes: ["Fixed full screen images in single post view."]
  },
  {
    version: "0.9.1",
    date: "2025-03-28",
    changes: [
      "Optimized timeline images.",
      "Changed the timeline full screen image viewer."
    ]
  },
  {
    version: "0.9",
    date: "2025-03-28",
    changes: [
      "Added suport for multiple images in a post.",
      "Improved navigation history on profiles."
    ]
  },
  {
    version: "0.8.6",
    date: "2025-03-20",
    changes: ["Fixed attachment and embed border styles."]
  },
  {
    version: "0.8.5",
    date: "2025-03-20",
    changes: [
      "Moved the posts delete job to the main codebase.",
      "Added some admin tools."
    ]
  },
  {
    version: "0.8.4",
    date: "2025-03-08",
    changes: ["Added titles and descriptions to boards."]
  },
  {
    version: "0.8.3",
    date: "2025-03-07",
    changes: ["Improved date formatting for posts."]
  },
  {
    version: "0.8.2",
    date: "2025-03-06",
    changes: ["Fixed boards grid on mobile.", "Fixed tabs on the profile."]
  },
  {
    version: "0.8.1",
    date: "2025-03-05",
    changes: ["Fix meta titles."]
  },
  {
    version: "0.8",
    date: "2025-03-05",
    changes: [
      "Added boards / collections.",
      "Fixed 404 pages not returning a 404 status.",
      "Fixed avatar rendering issues.",
      "Added a new mobile navigation along with some ui fixes."
    ]
  },
  {
    version: "0.7.4",
    date: "2025-02-28",
    changes: ["Added support page link for logged out users."]
  },
  {
    version: "0.7.3",
    date: "2025-02-27",
    changes: [
      "Changed OG image.",
      "Fixed a bug with large GIF uploads.",
      "Updated site title.",
      "Changed wording to 'creative people'."
    ]
  },
  {
    version: "0.7.2",
    date: "2025-02-22",
    changes: ["Hide the about banner on various pages when logged out."]
  },
  {
    version: "0.7.1",
    date: "2025-02-22",
    changes: ["Fixed meta descriptions for articles."]
  },
  {
    version: "0.7",
    date: "2025-02-21",
    changes: ["Added articles."]
  },
  {
    version: "0.6.4",
    date: "2025-02-17",
    changes: ["Fixed a message overflow bug."]
  },
  {
    version: "0.6.3",
    date: "2025-02-15",
    changes: [
      "Moved the buttons on the profile view.",
      "Renamed the gallery to media.",
      "Fixed the unread message indicator."
    ]
  },
  {
    version: "0.6.2",
    date: "2025-02-14",
    changes: [
      "Added replies & media tabs to profile.",
      "Fixed gif height issues."
    ]
  },
  {
    version: "0.6.1",
    date: "2025-02-13",
    changes: [
      "Improved avatar loading on the feed.",
      "Improved the feed loading.",
      "Added fade to ribbon.",
      "Fixed chat width on mobile."
    ]
  },
  {
    version: "0.6",
    date: "2025-02-11",
    changes: [
      "Added direct message functionality.",
      "Fixed feed rendering issues.",
      "Fixed metadata rendering.",
      "Added web socket functionality."
    ]
  },
  {
    version: "0.5.5",
    date: "2025-02-08",
    changes: [
      "Fixed a bug with the avatar cache.",
      "Fixed a bug with the name update. (Thanks to @jule for finding both)"
    ]
  },
  {
    version: "0.5.4",
    date: "2025-02-06",
    changes: [
      "Added feed preloading to make it feel more snappy.",
      "Fixed some visual bugs."
    ]
  },
  {
    version: "0.5.3",
    date: "2025-02-05",
    changes: ["Improved og image handling for posts with attachments."]
  },
  {
    version: "0.5.2",
    date: "2025-02-05",
    changes: ["Created a new composer (@junaidanjum)"]
  },
  {
    version: "0.5.1",
    date: "2025-02-05",
    changes: [
      "Added dynamic og images.",
      "Fixed metadata for profile and posts."
    ]
  },
  {
    version: "0.5",
    date: "2025-02-05",
    changes: ["Added stickers (still in beta).", "Optimized image loading."]
  },
  {
    version: "0.4.11",
    date: "2025-02-03",
    changes: [
      "Fixed a bug with the registration form not allowing spaces in the username. (@junaidanjum)"
    ]
  },
  {
    version: "0.4.10",
    date: "2025-02-03",
    changes: [
      "Fixed a bug with the following feed.",
      "Added a backend for importing posts from other platforms."
    ]
  },
  {
    version: "0.4.9",
    date: "2025-02-02",
    changes: [
      "Added a link to the settings on profile view.",
      "Fixed a bug with the feed."
    ]
  },
  {
    version: "0.4.8",
    date: "2025-02-01",
    changes: ["Added the post button to the profile view. Thanks @grafician"]
  },
  {
    version: "0.4.7",
    date: "2025-02-01",
    changes: ["Improved the pinned post feature."]
  },
  {
    version: "0.4.6",
    date: "2025-02-01",
    changes: [
      "Added a /support page.",
      "Updated the Manifesto & Privacy Policy."
    ]
  },
  {
    version: "0.4.5",
    date: "2025-01-31",
    changes: ["Added image scanning for nudity or obsene content."]
  },
  {
    version: "0.4.4",
    date: "2025-01-29",
    changes: ["Improved the image upload quality for smaller images."]
  },
  {
    version: "0.4.3",
    date: "2025-01-29",
    changes: [
      "Added a new reply composer.",
      "Performed some a little bit of code cleanup."
    ]
  },
  {
    version: "0.4.2",
    date: "2025-01-27",
    changes: [
      "Added link embeds.",
      "Simplified the feed api.",
      "Fixed some bugs with the push notifications manager.",
      "Offloaded various tasks that slowed down the site to a worker thread."
    ]
  },
  {
    versin: "0.4.1",
    date: "2025-01-26",
    changes: [
      "Fixed width issues on mobile.",
      "Implemented database backups.",
      "Fixed a couple of React hydration issues."
    ]
  },
  {
    version: "0.4",
    date: "2025-01-24",
    changes: [
      "Added web push notifications.",
      "Added the ablity to change the speed of the ribbon.",
      "Improved PWA support.",
      "Hidden action buttons from user's that are not signed in on the single post view."
    ]
  },
  {
    version: "0.3.7",
    date: "2025-01-24",
    changes: [
      "Added a password reset feature.",
      "Fixed some visual bugs.",
      "Mentions now show up in notifications."
    ]
  },
  {
    version: "0.3.6",
    date: "2025-01-23",
    changes: [
      "Added an option to disable ribbon scrolling. (in Account / Settings)",
      "Added an option to autocomplete a new password in on the registration page.",
      "Fixed reply composer issues.",
      "Fixed image metadat rotation issues."
    ]
  },
  {
    version: "0.3.5",
    date: "2025-01-23",
    changes: ["Added reply threads."]
  },
  {
    version: "0.3.4",
    date: "2025-01-23",
    changes: [
      "Fixed a bug which caused the feed to not infinitely scroll sometimes."
    ]
  },
  {
    version: "0.3.3",
    date: "2025-01-22",
    changes: [
      "Fixed a bug which caused vulnerability scanners to spam Sentry.",
      "Dropdown on posts now has a copy link option. Thanks @redeux",
      "Added a character counter to the composer."
    ]
  },
  {
    version: "0.3.2",
    date: "2025-01-22",
    changes: [
      "Fixed some visual bugs.",
      "Fixed a bunch of api bugs.",
      "Fixed picture uploads allowing more than one image. Thanks @dave",
      "Replaced the composer, with one that works better on mobile.",
      "Added a manifesto page.",
      "Added a privacy policy.",
      "Added temporary guidelines."
    ]
  },
  {
    version: "0.3.1",
    date: "2025-01-22",
    changes: [
      "Fixed a bug which casused deleted posts to be shown in the replies. Thanks @dave"
    ]
  },
  {
    version: "0.3",
    date: "2025-01-22",
    changes: [
      "Removed Request Access, users can now Register without an invite.",
      "Added email verification popup, and blocked posting if email is not verified.",
      "Added a self-hosted instance PostHog for feature flags to help with testing."
    ]
  },
  {
    version: "0.2",
    date: "2025-01-21",
    changes: [
      "Added notifications.",
      "Added GIF uploads.",
      "Fixed composer issues.",
      "Fixed profile web link width."
    ]
  },
  {
    version: "0.1.7",
    date: "2025-01-21",
    changes: [
      "Fixed a bug which allowed the ribbon to parse HTML. Thanks to @nickisnoble for finding it."
    ]
  },
  {
    version: "0.1.6",
    date: "2025-01-21",
    changes: [
      "You can now see who is following you and who you are following on your profile."
    ]
  },
  {
    version: "0.1.5",
    date: "2025-01-20",
    changes: [
      "Added the single post view.",
      "Added replying to posts.",
      "Added likes view on posts."
    ]
  },
  {
    version: "0.1.4",
    date: "2025-01-20",
    changes: [
      "Added error reporting, hopefully this will make things easier.",
      "Changed max lengths for some fields."
    ]
  },
  {
    version: "0.1.3",
    date: "2025-01-20",
    changes: [
      "Added admin tooling.",
      "Added email verification.",
      "Added post deletion."
    ]
  },
  {
    version: "0.1.2",
    date: "2025-01-20",
    changes: [
      "Fixed a local storage issues for feed selection.",
      "Added feed loading skeletons.",
      "Added ribbon caching.",
      "Added a media cdn with caching."
    ]
  },
  {
    version: "0.1.1",
    date: "2025-01-20",
    changes: [
      "Create a temporary production deployment workflow.",
      "Added login rate api limiting."
    ]
  }
];

export function ReleaseNotes() {
  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-2 pb-10">
      <div className="max-w-[83ch]">
        <h2 className="pb-8">Release Notes</h2>
        <div className="flex flex-col gap-4">
          {releases.map((release, i) => (
            <div key={i} className="flex flex-col" id={release.version}>
              <span className="font-bold opacity-75">
                Release {release.version}
              </span>
              <span className="pb-1 opacity-60">
                {dayjs(release.date).format("MMM D, YYYY")}
              </span>
              <ul className="pl-4">
                {release.changes.map((change, i) => (
                  <li key={i}>
                    –{" "}
                    <div
                      className="inline"
                      dangerouslySetInnerHTML={{
                        __html: parsePostBody(change)
                      }}
                    ></div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
