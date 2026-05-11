import React, { useState, useEffect } from "react";
import { C } from "../../shared/constants/colors.js";
import { UPDATE_TYPES } from "../../shared/utils/listing.js";
import { AddUpdateModal } from "./modals.jsx";
import { fetchQAData, setQAEnabled, insertQuestion, answerQuestion, deleteQuestion } from "../services/qaService.js";
import { S, mergeStyles } from "../../shared/styles/primitives.js";
function QASection({
  listingId,
  sellerId,
  DC,
  user
}) {
  const sx = {
    s1: DC => ({
      background: DC.white,
      borderRadius: 12,
      padding: "14px",
      marginTop: 10,
      border: `1px solid ${DC.border}`
    }),
    s2: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14
    },
    s3: DC => ({
      fontSize: 15,
      fontWeight: 800,
      color: DC.text
    }),
    s4: DC => ({
      fontSize: 11,
      color: DC.text3
    }),
    s5: (qaEnabled, C) => ({
      width: 42,
      height: 24,
      borderRadius: 12,
      background: qaEnabled ? C.primary : "#ccc",
      cursor: "pointer",
      position: "relative",
      transition: "background 0.2s"
    }),
    s6: qaEnabled => ({
      position: "absolute",
      top: 3,
      right: qaEnabled ? 3 : "auto",
      left: qaEnabled ? "auto" : 3,
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: "white",
      transition: "all 0.2s",
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
    }),
    s7: DC => ({
      textAlign: "center",
      padding: "20px",
      color: DC.text3,
      fontSize: 13
    }),
    s8: DC => ({
      textAlign: "center",
      padding: "16px",
      color: DC.text3,
      fontSize: 13
    }),
    s9: {
      display: "flex",
      gap: 8,
      marginTop: 8
    },
    s10: DC => ({
      flex: 1,
      padding: "10px 14px",
      borderRadius: 12,
      border: `1.5px solid ${DC.border}`,
      fontSize: 13,
      fontFamily: "inherit",
      background: DC.white,
      color: DC.text,
      outline: "none"
    }),
    s11: C => ({
      padding: "10px 14px",
      borderRadius: 12,
      border: "none",
      background: C.primary,
      color: "white",
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    })
  };
  if (!DC) DC = C;
  const isSeller = user?.id === sellerId;
  const [questions, setQuestions] = useState([]);
  const [qaEnabled, setQaEnabled] = useState(true);
  const [newQ, setNewQ] = useState("");
  const [answerTexts, setAnswerTexts] = useState({});
  const loadQA = async () => {
    const {
      enabled,
      questions: qs
    } = await fetchQAData(listingId);
    setQaEnabled(enabled);
    setQuestions(qs);
  };
  useEffect(() => {
    if (listingId) loadQA();
  }, [listingId]);
  const toggleQA = async () => {
    const val = !qaEnabled;
    await setQAEnabled(listingId, val);
    setQaEnabled(val);
  };
  const submitQ = async () => {
    if (!newQ.trim() || !qaEnabled || !user?.id) return;
    await insertQuestion(listingId, user.id, newQ.trim());
    setNewQ("");
    loadQA();
  };
  const answerQ = async qId => {
    const text = answerTexts[qId];
    if (!text?.trim()) return;
    await answerQuestion(qId, text);
    setAnswerTexts(p => ({
      ...p,
      [qId]: ""
    }));
    loadQA();
  };
  const deleteQ = async qId => {
    const {
      error
    } = await deleteQuestion(qId, user?.id, false);
    if (error) {
      console.error("deleteQ error:", error.message);
      return;
    }
    setQuestions(p => p.filter(q => q.id !== qId));
  };
  return <div style={sx.s1(DC)}>
      <div style={sx.s2}>
        <div style={sx.s3(DC)}>{"الأسئلة والأجوبة ❓"}</div>
        {isSeller && <div style={S.rowCenterGap8}>
            <span style={sx.s4(DC)}>{qaEnabled ? "مفعّل" : "موقف"}</span>
            <div onClick={toggleQA} style={sx.s5(qaEnabled, C)}>
              <div style={sx.s6(qaEnabled)} />
            </div>
          </div>}
      </div>

      {!qaEnabled && !isSeller && <div style={sx.s7(DC)}>{"🔒 الأسئلة مغلقة حالياً"}</div>}

      {(qaEnabled || isSeller) && <>
          {questions.length === 0 && <div style={sx.s8(DC)}>لا توجد أسئلة بعد</div>}
          {questions.map(q => {
        const sx = {
          s1: DC => ({
            marginBottom: 12,
            background: DC.bg,
            borderRadius: 10,
            padding: "12px 14px",
            position: "relative"
          }),
          s2: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start"
          },
          s3: DC => ({
            fontSize: 13,
            fontWeight: 700,
            color: DC.text,
            marginBottom: 2
          }),
          s4: DC => ({
            fontSize: 11,
            color: DC.text3,
            marginBottom: 6
          }),
          s5: {
            background: "none",
            border: "none",
            color: "#EF4444",
            fontSize: 16,
            cursor: "pointer",
            padding: "0 4px",
            lineHeight: 1
          },
          s6: (C, DC) => ({
            fontSize: 13,
            color: C.primary,
            fontWeight: 600,
            borderTop: `1px solid ${DC.border}`,
            paddingTop: 8,
            marginTop: 4
          }),
          s7: {
            display: "flex",
            gap: 6,
            marginTop: 6
          },
          s8: DC => ({
            flex: 1,
            padding: "7px 10px",
            borderRadius: 8,
            border: `1px solid ${DC.border}`,
            fontSize: 12,
            fontFamily: "inherit",
            background: DC.white,
            color: DC.text,
            outline: "none"
          }),
          s9: C => ({
            padding: "7px 14px",
            borderRadius: 8,
            border: "none",
            background: C.primary,
            color: "white",
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 700
          }),
          s10: DC => ({
            fontSize: 12,
            color: DC.text3
          })
        };
        return <div key={q.id} style={sx.s1(DC)}>
              <div style={sx.s2}>
                <div style={S.flex1}>
                  <div style={sx.s3(DC)}>س: {q.question}</div>
                  <div style={sx.s4(DC)}>— {q.profiles?.name || "مستخدم"}</div>
                </div>
                {isSeller && <button onClick={() => deleteQ(q.id)} style={sx.s5}>{"🗑"}</button>}
              </div>
              {q.answer ? <div style={sx.s6(C, DC)}>ج: {q.answer}</div> : isSeller ? <div style={sx.s7}>
                      <input value={answerTexts[q.id] || ""} onChange={e => setAnswerTexts(p => ({
              ...p,
              [q.id]: e.target.value
            }))} onKeyDown={e => e.key === "Enter" && answerQ(q.id)} placeholder="اكتب إجابتك..." style={sx.s8(DC)} />
                      <button onClick={() => answerQ(q.id)} style={sx.s9(C)}>إجابة</button>
                    </div> : <div style={sx.s10(DC)}>في انتظار الإجابة...</div>}
            </div>;
      })}

          {user?.id && qaEnabled && !isSeller && <div style={sx.s9}>
              <input value={newQ} onChange={e => setNewQ(e.target.value)} onKeyDown={e => e.key === "Enter" && submitQ()} placeholder="اطرح سؤالاً..." style={sx.s10(DC)} />
              <button onClick={submitQ} style={sx.s11(C)}>إرسال</button>
            </div>}
        </>}
    </div>;
}
export { QASection };
