import * as React from "react";
import {
  Button,
  CodeBlock,
  CodeInline,
  Html,
  Link,
  Text
} from "@react-email/components";

export const VerifyEmail = (props: { name: string }) => {
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
        Your Password Was Reset
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
          Hey {props.name || "there"}!
        </span>{" "}
        Your password was reset successfully.
      </Text>

      <Text
        style={{
          fontSize: "13px",
          margin: "20px 0",
          fontFamily: "Courier, monospace"
        }}
      >
        If you didn't do this, contact support immediately:{" "}
        <a
          href="mailto:help@folkscommunity.com"
          style={{
            color: "inherit",
            textDecoration: "underline"
          }}
        >
          help@folkscommunity.com
        </a>
      </Text>

      <Text
        style={{
          fontSize: "13px",
          margin: "20px 0",
          fontFamily: "Courier, monospace"
        }}
      >
        — Folks
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
          href="https://folkscommunity.com/manifesto"
          style={{
            color: "rgb(0, 0, 0)",
            textDecoration: "underline",
            fontFamily: "Courier, monospace"
          }}
        >
          Manifesto
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

export default VerifyEmail;
