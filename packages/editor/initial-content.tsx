export const initialContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      attrs: {
        class: null,
        textAlign: null
      },
      content: [
        {
          type: "text",
          marks: [
            {
              type: "textStyle",
              attrs: {
                fontSize: "16px"
              }
            }
          ],
          text: "This post will guide you step-by-step through the process of creating an internet radio station using the "
        },
        {
          type: "text",
          marks: [
            {
              type: "link",
              attrs: {
                href: "https://icecast.org/",
                target: "_blank",
                rel: "noopener noreferrer nofollow",
                class: null
              }
            }
          ],
          text: "Icecast"
        },
        {
          type: "text",
          marks: [
            {
              type: "textStyle",
              attrs: {
                fontSize: "16px"
              }
            }
          ],
          text: " streaming server, with "
        },
        {
          type: "text",
          marks: [
            {
              type: "link",
              attrs: {
                href: "https://liquidsoap.info/",
                target: "_blank",
                rel: "noopener noreferrer nofollow",
                class: null
              }
            }
          ],
          text: "LiquidSoap"
        },
        {
          type: "text",
          marks: [
            {
              type: "textStyle",
              attrs: {
                fontSize: "16px"
              }
            }
          ],
          text: " as the audio router and "
        },
        {
          type: "text",
          marks: [
            {
              type: "link",
              attrs: {
                href: "https://mopidy.com/",
                target: "_blank",
                rel: "noopener noreferrer nofollow",
                class: null
              }
            }
          ],
          text: "Mopidy"
        },
        {
          type: "text",
          marks: [
            {
              type: "textStyle",
              attrs: {
                fontSize: "16px"
              }
            }
          ],
          text: " as the music server."
        }
      ]
    },
    {
      type: "imageBlock",
      attrs: {
        src: "https://cdn.rokita.me/blog/creating-a-radio-station/diagram.png",
        width: "75%",
        align: "center"
      }
    },
    {
      type: "heading",
      attrs: {
        textAlign: null,
        level: 3
      },
      content: [
        {
          type: "text",
          marks: [
            {
              type: "bold"
            }
          ],
          text: "Prerequisites"
        }
      ]
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              attrs: {
                class: null,
                textAlign: null
              },
              content: [
                {
                  type: "text",
                  text: "A Linux VM with root access (i’m using Ubuntu 24.04 LTS)."
                }
              ]
            }
          ]
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              attrs: {
                class: null,
                textAlign: null
              },
              content: [
                {
                  type: "text",
                  text: "A local music library, or a streaming account."
                }
              ]
            }
          ]
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              attrs: {
                class: null,
                textAlign: null
              },
              content: [
                {
                  type: "text",
                  text: "Make sure you run "
                },
                {
                  type: "text",
                  marks: [
                    {
                      type: "code"
                    }
                  ],
                  text: "sudo apt-get update"
                },
                {
                  type: "text",
                  text: " before installing any packages."
                }
              ]
            }
          ]
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              attrs: {
                class: null,
                textAlign: null
              },
              content: [
                {
                  type: "text",
                  text: "We also need to install "
                },
                {
                  type: "text",
                  marks: [
                    {
                      type: "code"
                    }
                  ],
                  text: "ffmpeg"
                },
                {
                  type: "text",
                  text: " and "
                },
                {
                  type: "text",
                  marks: [
                    {
                      type: "code"
                    }
                  ],
                  text: "python3"
                },
                {
                  type: "text",
                  text: ", here’s the command:"
                },
                {
                  type: "hardBreak"
                },
                {
                  type: "text",
                  marks: [
                    {
                      type: "code"
                    }
                  ],
                  text: "sudo apt install -y ffmpeg python3 python3-pip"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      type: "heading",
      attrs: {
        textAlign: null,
        level: 3
      },
      content: [
        {
          type: "text",
          marks: [
            {
              type: "bold"
            }
          ],
          text: "Setting Up Icecast"
        }
      ]
    },
    {
      type: "paragraph",
      attrs: {
        class: null,
        textAlign: null
      },
      content: [
        {
          type: "text",
          text: "First, we need to install Icecast on our server."
        }
      ]
    },
    {
      type: "codeBlock",
      attrs: {
        language: "bash"
      },
      content: [
        {
          type: "text",
          text: "sudo apt-get install icecast2"
        }
      ]
    },
    {
      type: "paragraph",
      attrs: {
        class: null,
        textAlign: null
      },
      content: [
        {
          type: "text",
          marks: [
            {
              type: "textStyle",
              attrs: {
                fontSize: "16px"
              }
            }
          ],
          text: "During the installation, select "
        },
        {
          type: "text",
          marks: [
            {
              type: "code"
            }
          ],
          text: "Yes"
        },
        {
          type: "text",
          marks: [
            {
              type: "textStyle",
              attrs: {
                fontSize: "16px"
              }
            }
          ],
          text: " to configure Icecast."
        }
      ]
    },
    {
      type: "imageBlock",
      attrs: {
        src: "https://cdn.rokita.me/blog/creating-a-radio-station/icecast-install-1.png",
        width: "75%",
        align: "center"
      }
    },
    {
      type: "paragraph",
      attrs: {
        class: null,
        textAlign: null
      }
    }
  ]
};
