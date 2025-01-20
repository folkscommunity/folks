import * as React from "react";
import { Button, Html, Link, Text } from "@react-email/components";

export const Invite = (props: { url: string }) => {
  return (
    <Html
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: "Courier, monospace",
        fontSize: "13px",
        letterSpacing: "-0.573846px",
        padding: "5px 15px",
        maxWidth: "620px"
      }}
    >
      <Text
        style={{
          fontWeight: "bold",
          fontSize: "13px",
          fontFamily: "Courier, monospace"
        }}
      >
        You're Invited to Folks!
      </Text>

      <Text
        style={{
          fontSize: "13px",
          margin: "20px 0",
          fontFamily: "Courier, monospace"
        }}
      >
        <span
          style={{
            fontWeight: "bold",
            fontSize: "13px",
            margin: "20px 0",
            fontFamily: "Courier, monospace"
          }}
        >
          Hello!
        </span>{" "}
        You have been invited to join Folks, a community for product people. The
        <br />
        you can go ahead and register with this email address.
      </Text>

      <Button
        href={props.url}
        style={{
          background: "#E2E5EA",
          fontFamily: "Courier, monospace",
          margin: "20px 0",
          color: "#000000",
          fontWeight: "bold",
          fontSize: "13px",
          padding: "12px 20px",
          border: "1px solid rgb(210, 214, 219)",
          borderRadius: "10px",
          letterSpacing: "0.23px"
        }}
      >
        Go to Folks
      </Button>

      <Text
        style={{
          fontSize: "13px",
          margin: "20px 0",
          fontFamily: "Courier, monospace"
        }}
      >
        If you need any help, feel free to reach out to us by replying to this
        email.
      </Text>

      <Text
        style={{
          fontSize: "13px",
          margin: "20px 0",
          fontFamily: "Courier, monospace"
        }}
      >
        <Link
          href={props.url}
          style={{
            color: "rgb(155, 163, 172)",
            textDecoration: "underline",
            fontFamily: "Courier, monospace"
          }}
        >
          {props.url}
        </Link>
      </Text>

      <Text
        style={{
          fontSize: "13px",
          margin: "20px 0",
          fontFamily: "Courier, monospace"
        }}
      >
        Let's build something together, that will last.
      </Text>

      <Text
        style={{
          fontSize: "13px",
          margin: "20px 0",
          fontFamily: "Courier, monospace"
        }}
      >
        — Johny @ Folks
      </Text>

      <Text
        style={{
          color: "rgb(185, 191, 198)",
          fontSize: "13px",
          margin: "20px 0",
          fontFamily: "Courier, monospace"
        }}
      >
        ·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·
        ·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·
      </Text>

      <Text
        style={{
          fontWeight: "bold",
          fontSize: "13px",
          margin: "20px 0",
          fontFamily: "Courier, monospace"
        }}
      >
        Other Useful Links
      </Text>

      <Text
        style={{
          fontSize: "13px",
          margin: "20px 0",
          fontFamily: "Courier, monospace"
        }}
      >
        <Link
          href="https://folkscommunity.com"
          style={{
            color: "rgb(0, 0, 0)",
            textDecoration: "underline",
            fontFamily: "Courier, monospace"
          }}
        >
          Folks
        </Link>
        ,{" "}
        <Link
          href="https://folkscommunity.com/guidelines"
          style={{
            color: "rgb(0, 0, 0)",
            textDecoration: "underline",
            fontFamily: "Courier, monospace"
          }}
        >
          Guidelines
        </Link>
        ,{" "}
        <Link
          href="https://folkscommunity.com/about"
          style={{
            color: "rgb(0, 0, 0)",
            textDecoration: "underline",
            fontFamily: "Courier, monospace"
          }}
        >
          About
        </Link>
      </Text>

      <Text
        style={{
          color: "rgb(185, 191, 198)",
          fontSize: "13px",
          margin: "20px 0",
          fontFamily: "Courier, monospace"
        }}
      >
        ·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·
        ·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·
      </Text>

      <pre
        style={{
          font: "8px / 8px Courier",
          color: "rgb(155, 163, 172)",
          letterSpacing: "-1px",
          marginTop: "20px"
        }}
      >
        {`███████╗ ██████╗ ██╗     ██╗  ██╗███████╗
██╔════╝██╔═══██╗██║     ██║ ██╔╝██╔════╝
█████╗  ██║   ██║██║     █████╔╝ ███████╗
██╔══╝  ██║   ██║██║     ██╔═██╗ ╚════██║
██║     ╚██████╔╝███████╗██║  ██╗███████║
╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝`}
      </pre>
    </Html>
  );
};

export default Invite;
