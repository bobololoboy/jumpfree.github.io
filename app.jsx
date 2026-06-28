import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { createRoot } from "react-dom/client";
import { WebsimSocket, useQuery } from "@websim/use-query";
import "./game.js";
const room = new WebsimSocket();
function useIsMobile(breakpointPx = 768) {
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth <= breakpointPx);
  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const onChange = () => setIsMobile(mq.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, [breakpointPx]);
  return isMobile;
}
function Leaderboard({ onClose, audio, palette }) {
  const isMobile = useIsMobile();
  const SPECIAL_USER = "Absolutely_Aaden123";
  const { data: scores, loading } = useQuery(room.query(`
        WITH user_info AS (
            SELECT id, username FROM public.user
        )
        SELECT
            s.distance,
            s.time_ms,
            u.username,
            s.id as user_id
        FROM public.scores_v1 s
        JOIN user_info u ON s.id = u.id
        ORDER BY s.distance DESC, s.time_ms ASC
        LIMIT 50
    `));
  const specialIsTop = !!(scores && scores[0] && scores[0].username === SPECIAL_USER);
  const [hoveredRow, setHoveredRow] = React.useState(null);
  const formatTime = (ms) => (ms / 1e3).toFixed(2) + "s";
  const handleClose = () => {
    audio.play("button_click");
    onClose();
  };
  const handleRowClick = (username) => {
    window.open(`https://websim.com/@${username}`, "_blank");
  };
  const MIN_ROWS = isMobile ? 6 : 8;
  const MAX_ROWS = isMobile ? 10 : 16;
  const ROW_H = isMobile ? 38 : 44;
  const HEADER_H = isMobile ? 40 : 44;
  const rowCount = !loading && scores ? scores.length : 0;
  const visibleRows = Math.min(rowCount, MAX_ROWS);
  const baseRows = Math.max(MIN_ROWS, Math.min(rowCount || MIN_ROWS, MAX_ROWS));
  const rowsHeight = HEADER_H + visibleRows * ROW_H + 8;
  const baseHeight = HEADER_H + baseRows * ROW_H + 8;
  const viewportCap = Math.floor(window.innerHeight * (isMobile ? 0.46 : 0.6));
  const maxHeight = Math.min(rowsHeight, viewportCap);
  const minHeight = Math.min(baseHeight, viewportCap);
  const Stamp = ({ rank }) => {
    if (rank === 1) {
      return /* @__PURE__ */ jsxDEV(
        "svg",
        {
          "aria-hidden": "true",
          width: isMobile ? 14 : 16,
          height: isMobile ? 14 : 16,
          viewBox: "0 0 24 24",
          style: {
            position: "absolute",
            top: isMobile ? "-5px" : "-6px",
            left: isMobile ? "-8px" : "-10px",
            transform: "rotate(-12deg)",
            filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.25))"
          },
          children: /* @__PURE__ */ jsxDEV(
            "path",
            {
              d: "M2 14s4 3 10 3 10-3 10-3L19.7 4 15.36 8.31 12 4 8.64 8.31 4.27 4 2 14Z",
              fill: "#FFD700",
              stroke: palette.foreground,
              strokeWidth: "1",
              strokeLinejoin: "round",
              strokeLinecap: "round"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 90,
              columnNumber: 21
            },
            this
          )
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 77,
          columnNumber: 17
        },
        this
      );
    }
    if (rank === 2) {
      return /* @__PURE__ */ jsxDEV(
        "svg",
        {
          "aria-hidden": "true",
          width: isMobile ? 12 : 14,
          height: isMobile ? 12 : 14,
          viewBox: "0 0 24 24",
          style: {
            position: "absolute",
            top: isMobile ? "-3px" : "-4px",
            left: isMobile ? "-6px" : "-8px",
            transform: "rotate(-8deg)",
            filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.25))"
          },
          children: /* @__PURE__ */ jsxDEV("circle", { cx: "12", cy: "12", r: "9", fill: "#C0C0C0", stroke: palette.foreground, strokeWidth: "1" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 116,
            columnNumber: 21
          }, this)
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 103,
          columnNumber: 17
        },
        this
      );
    }
    return null;
  };
  const colRankW = isMobile ? "36px" : "44px";
  const colDistW = isMobile ? "98px" : "120px";
  const colTimeW = isMobile ? "84px" : "100px";
  const fontSize = isMobile ? 13 : 14;
  const displayRankForIndex = (idx) => specialIsTop ? idx : idx + 1;
  const stampRankForIndex = (idx) => specialIsTop ? idx : idx + 1;
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("h2", { className: "text-3xl font-bold mb-4", style: { fontSize: isMobile ? 20 : void 0 }, children: "Leaderboard" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 133,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(
      "div",
      {
        className: "leaderboard-scroll",
        style: {
          maxHeight,
          minHeight,
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: 6,
          scrollbarWidth: "thin",
          // Themed scrollbar colors via CSS variables
          "--scrollbar-thumb": palette.foreground,
          "--scrollbar-track": palette.background,
          "--scrollbar-thumb-hover": "color-mix(in srgb, " + palette.foreground + ", transparent 20%)",
          "--scrollbar-corner": "transparent"
        },
        children: [
          loading && /* @__PURE__ */ jsxDEV("p", { style: { fontSize }, children: "Loading..." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 150,
            columnNumber: 29
          }, this),
          !loading && scores && scores.length === 0 && /* @__PURE__ */ jsxDEV("p", { style: { fontSize }, children: "No scores yet. Be the first!" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 151,
            columnNumber: 63
          }, this),
          !loading && scores && /* @__PURE__ */ jsxDEV("table", { className: "w-full text-left", style: { tableLayout: "fixed", width: "100%", fontSize }, children: [
            /* @__PURE__ */ jsxDEV("colgroup", { children: [
              /* @__PURE__ */ jsxDEV("col", { style: { width: colRankW } }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 155,
                columnNumber: 29
              }, this),
              /* @__PURE__ */ jsxDEV("col", {}, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 156,
                columnNumber: 29
              }, this),
              /* @__PURE__ */ jsxDEV("col", { style: { width: colDistW } }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 157,
                columnNumber: 29
              }, this),
              /* @__PURE__ */ jsxDEV("col", { style: { width: colTimeW } }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 158,
                columnNumber: 29
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 154,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { style: { borderBottom: `2px solid ${palette.foreground}`, height: HEADER_H }, children: [
              /* @__PURE__ */ jsxDEV("th", { className: "p-2", children: "#" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 162,
                columnNumber: 33
              }, this),
              /* @__PURE__ */ jsxDEV("th", { className: "p-2", children: "Player" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 163,
                columnNumber: 33
              }, this),
              /* @__PURE__ */ jsxDEV("th", { className: "p-2", children: "Distance" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 164,
                columnNumber: 33
              }, this),
              /* @__PURE__ */ jsxDEV("th", { className: "p-2", children: "Time" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 165,
                columnNumber: 33
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 161,
              columnNumber: 29
            }, this) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 160,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV("tbody", { children: scores.map((score, index) => {
              const displayRank = displayRankForIndex(index);
              const stampRank = stampRankForIndex(index);
              return /* @__PURE__ */ jsxDEV(
                "tr",
                {
                  className: "border-b",
                  style: {
                    borderColor: "rgba(128,128,128,0.5)",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease",
                    backgroundColor: hoveredRow === score.user_id ? `color-mix(in srgb, ${palette.foreground}, transparent 90%)` : "transparent",
                    height: ROW_H
                  },
                  onClick: () => handleRowClick(score.username),
                  onMouseEnter: () => setHoveredRow(score.user_id),
                  onMouseLeave: () => setHoveredRow(null),
                  children: [
                    /* @__PURE__ */ jsxDEV("td", { className: "p-2 font-bold", style: { whiteSpace: "nowrap", textAlign: "right" }, children: displayRank }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 187,
                      columnNumber: 41
                    }, this),
                    /* @__PURE__ */ jsxDEV("td", { className: "p-2", style: { position: "relative" }, children: /* @__PURE__ */ jsxDEV("div", { style: { position: "relative", display: "inline-block", paddingLeft: "6px", maxWidth: "100%" }, children: [
                      /* @__PURE__ */ jsxDEV(Stamp, { rank: stampRank }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 190,
                        columnNumber: 49
                      }, this),
                      /* @__PURE__ */ jsxDEV(
                        "span",
                        {
                          className: "truncate",
                          style: {
                            display: "inline-block",
                            verticalAlign: "middle",
                            maxWidth: "100%",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            // Glow effect for the special user
                            ...score.username === SPECIAL_USER ? {
                              color: palette.foreground,
                              textShadow: `
                                                                0 0 6px ${palette.foreground},
                                                                0 0 10px ${palette.foreground},
                                                                0 0 14px ${palette.foreground},
                                                                0 0 20px ${palette.foreground}
                                                            `,
                              fontWeight: 700
                            } : {}
                          },
                          title: score.username,
                          children: score.username
                        },
                        void 0,
                        false,
                        {
                          fileName: "<stdin>",
                          lineNumber: 191,
                          columnNumber: 49
                        },
                        this
                      )
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 189,
                      columnNumber: 45
                    }, this) }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 188,
                      columnNumber: 41
                    }, this),
                    /* @__PURE__ */ jsxDEV("td", { className: "p-2", style: { whiteSpace: "nowrap", textAlign: "right" }, children: [
                      score.distance,
                      "m"
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 218,
                      columnNumber: 41
                    }, this),
                    /* @__PURE__ */ jsxDEV("td", { className: "p-2", style: { whiteSpace: "nowrap", textAlign: "right" }, children: formatTime(score.time_ms) }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 219,
                      columnNumber: 41
                    }, this)
                  ]
                },
                score.user_id,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 173,
                  columnNumber: 37
                },
                this
              );
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 168,
              columnNumber: 25
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 153,
            columnNumber: 21
          }, this)
        ]
      },
      void 0,
      true,
      {
        fileName: "<stdin>",
        lineNumber: 134,
        columnNumber: 13
      },
      this
    ),
    /* @__PURE__ */ jsxDEV(
      "button",
      {
        onClick: handleClose,
        className: "mt-6 py-2 px-5 font-bold",
        style: {
          "--button-bg": palette.background,
          "--button-text": palette.foreground,
          "--button-border": palette.foreground,
          fontSize: isMobile ? 14 : 16
        },
        children: "Close"
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 227,
        columnNumber: 13
      },
      this
    )
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 132,
    columnNumber: 9
  }, this);
}
let leaderboardRoot = null;
document.addEventListener("show-leaderboard", (e) => {
  const { audioManager, onClose, palette } = e.detail;
  const container = document.getElementById("leaderboardPopup");
  if (!leaderboardRoot) {
    leaderboardRoot = createRoot(container);
  }
  leaderboardRoot.render(/* @__PURE__ */ jsxDEV(Leaderboard, { onClose, audio: audioManager, palette }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 252,
    columnNumber: 28
  }));
});
