# Cơ Sở Lý Thuyết: LLM + Prompting + Structured Output

Tài liệu này trình bày nền tảng, nguyên tắc thiết kế, và khuyến nghị thực hành để kết hợp LLM, kỹ thuật prompting, và structured output (JSON) trong AI Matching Service (FastAPI + OpenAI). Hướng tới mức độ “tài liệu chuyên nghiệp”: có mục tiêu rõ ràng, phạm vi, rủi ro, checklist kiểm thử, và gợi ý triển khai.

## Phạm vi và mục tiêu
- Mục tiêu: chuẩn hóa cách gọi LLM để chấm điểm/ranking job–interpreter, đảm bảo đầu ra JSON hợp lệ, giảm ảo giác, tối ưu chi phí và độ ổn định.
- Phạm vi: bao gồm thiết kế prompt, schema JSON, quy trình gọi model, hậu kiểm, logging/giám sát, và định hướng mở rộng (RAG/guardrails).
- Không bao gồm: hạ tầng CI/CD, bảo mật hạ tầng, hay tối ưu GPU inference (vì dùng OpenAI API).

## 1) Nền tảng LLM
- Kiến trúc: Transformer (multi-head self-attention, positional encoding, feed-forward). Sinh token tự hồi quy; mỗi bước nhìn toàn bộ ngữ cảnh đã thấy.
- Huấn luyện: pretrain trên corpora lớn (MLM/CLM) → instruction-tuning (SFT) trên tập “input → output” có nhãn → RLHF/RLAIF để phù hợp kỳ vọng con người/agent.
- Năng lực: hiểu ngôn ngữ tự nhiên, suy luận chuỗi bước (CoT), tổng hợp/biến đổi dữ liệu có cấu trúc (JSON, code), lập kế hoạch đơn giản, đưa ra giải thích.
- Giới hạn: ảo giác (bịa thông tin), nhạy cảm phrasing, suy giảm khi ngữ cảnh dài (context overflow), không tự kiểm định tính đúng nếu không được yêu cầu/không có dữ liệu gốc; dễ trượt format khi không có ràng buộc chặt.
- Hệ quả: cần ràng buộc đầu ra (structured output), cung cấp dữ liệu nguồn (grounding/RAG), và đặt guardrails trong prompt.

## 2) Prompting (thiết kế lời gọi)
- Role & task framing: khai báo rõ vai trò (vd: “Recruitment/HR matching expert”), mục tiêu (scoring, ranking), và phạm vi (chỉ dùng dữ liệu cung cấp).
- Input specification: mô tả trường dữ liệu job + interpreter, tiêu chí chấm điểm (ngôn ngữ, chuyên ngành, kinh nghiệm, rate, chứng chỉ), ngưỡng lọc.
- Output format: yêu cầu JSON/schema; cung cấp ví dụ hợp lệ và ví dụ sai (để tránh lẫn văn bản tự do).
- Constraints: ngôn ngữ trả lời, độ dài tối đa, cấm bịa, cấm dẫn nguồn không có; nếu thiếu dữ liệu thì báo thiếu thay vì tự suy diễn.
- Reasoning: khuyến khích Chain-of-Thought ẩn (“reason step-by-step, then output JSON only”), hoặc ReAct nếu có công cụ (retrieval/validation).
- Few-shot / pattern: đưa 1-2 ví dụ rút gọn để ổn định thứ tự trường và cách diễn giải điểm số.
- Tham số model: temperature thấp (~0-0.4) khi ưu tiên ổn định format; top_p vừa phải; max_tokens đủ bao toàn bộ JSON; presence/frequency penalty điều tiết lặp.
- Chia nhỏ nhiệm vụ: nếu prompt quá dài, tách thành bước: (1) trích thông tin chính, (2) chấm điểm, (3) sinh JSON tổng hợp.

## 3) Structured Output (JSON/Schema)
- JSON-first: “Chỉ trả về JSON hợp lệ” để tránh lẫn văn bản; tách phần giải thích nếu cần (hai kênh riêng).
- Schema ràng buộc: khai báo kiểu, enum, min/max, pattern; giúp LLM tự kiểm và giúp backend validate (Pydantic + JSON Schema).
- Constrained decoding: dùng `response_format={"type": "json_object"}` (nếu model hỗ trợ) hoặc grammar/regex để ép cấu trúc.
- Validation hậu kiểm: parse JSON → validate schema → nếu lỗi, yêu cầu model tự sửa (vòng repair) hoặc fallback.
- Determinism: hạ temperature, cố định schema, kiểm tra trước/sau; loại kết quả trượt format.
- Khuyến nghị schema (ví dụ):
  - overall_score (0-100, float), score_level (enum: excellent/good/fair/poor)
  - reasons[] {category, score 0-100, explanation}
  - strengths[] (string), weaknesses[] (string)
  - recommendation (string), match_priority (int), processing_notes (optional)

### Mẫu schema chi tiết (minh họa)
```json
{
  "type": "object",
  "properties": {
    "overall_score": {"type": "number", "minimum": 0, "maximum": 100},
    "score_level": {"type": "string", "enum": ["excellent", "good", "fair", "poor"]},
    "reasons": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "category": {"type": "string"},
          "score": {"type": "number", "minimum": 0, "maximum": 100},
          "explanation": {"type": "string"}
        },
        "required": ["category", "score", "explanation"]
      }
    },
    "strengths": {"type": "array", "items": {"type": "string"}},
    "weaknesses": {"type": "array", "items": {"type": "string"}},
    "recommendation": {"type": "string"},
    "match_priority": {"type": "integer", "minimum": 1},
    "flags": {"type": "array", "items": {"type": "string"}},
    "processing_notes": {"type": "string"}
  },
  "required": ["overall_score", "score_level", "reasons", "strengths", "weaknesses", "recommendation", "match_priority"]
}
```

## 4) Kết hợp 3 thành phần trong pipeline service (LLM + Prompting + Structured Output)
1) Tiền xử lý:
   - Chuẩn hóa text (strip, chuẩn Unicode), lọc ký tự lạ; loại trường thừa.
   - Ràng buộc ngôn ngữ/locale nếu cần; ẩn/mask PII trong log.
2) Ghép ngữ cảnh (context assembly):
   - System prompt: vai trò, guardrails (cấm bịa, chỉ dùng dữ liệu cung cấp, phải trả JSON).
   - Instructions: mô tả format JSON, schema, ví dụ hợp lệ/sai.
   - User content: dữ liệu job/interpreter + tiêu chí + ngưỡng lọc.
   - (Tùy chọn) RAG: chèn trích đoạn mô tả domain/terminology để tăng grounding.
3) Gọi LLM:
   - Model: GPT-4 (hoặc từ `OPENAI_MODEL`), temperature thấp, `response_format=json_object` nếu hỗ trợ.
   - Giới hạn độ dài: set max_tokens để đủ chứa toàn bộ JSON.
4) Hậu xử lý:
   - Parse JSON, validate schema (Pydantic/JSON Schema).
   - Tính các trường dẫn xuất: score_level, match_priority, flags (thiếu dữ liệu, trên ngân sách).
   - Nếu lỗi format: kích hoạt vòng “repair” (gửi lại với lỗi cụ thể, yêu cầu tự sửa).
5) Kiểm soát & logging:
   - Ghi prompt/response đã làm mờ PII; log vi phạm schema/ảo giác.
   - Giám sát tỉ lệ JSON hợp lệ, latency, chi phí, tần suất lỗi.

### Checklist triển khai pipeline
- [ ] Chuẩn hóa input, bỏ trường không dùng.
- [ ] Có system prompt nêu rõ vai trò + guardrails.
- [ ] Có hướng dẫn JSON + schema + ví dụ hợp lệ/sai.
- [ ] Bật JSON mode/grammar hoặc `response_format`.
- [ ] Hạn chế temperature, đủ max_tokens cho JSON.
- [ ] Hậu kiểm: parse + validate; vòng repair khi lỗi.
- [ ] Log (ẩn PII), thống kê lỗi, cảnh báo.

## 5) Kỹ thuật giảm ảo giác và tăng độ tin cậy
- Grounding/RAG: cung cấp trích đoạn gốc (job, interpreter, domain) trong prompt; yêu cầu dẫn chiếu nguồn hoặc trả về unknown nếu thiếu.
- Guardrails trong prompt: “Không bịa. Nếu thiếu dữ liệu, trả về status=unknown/insufficient_info và lý do”.
- Constrained decoding: JSON mode/grammar; regex/validator hậu kiểm.
- Temperature thấp + schema: ổn định cấu trúc và nội dung; giảm variance.
- Kiểm tra chéo: nếu cần, gọi hai lượt và so sánh; hoặc self-check (một lượt sinh, một lượt kiểm).
- Tách reasoning và final: yêu cầu CoT ẩn, final chỉ là JSON.

### Mẫu guardrails trong prompt
- “Chỉ dùng thông tin được cung cấp. Không bịa thêm.”
- “Nếu thiếu dữ liệu để chấm một tiêu chí, đánh dấu flag và nêu rõ thiếu gì.”
- “Phải trả về JSON hợp lệ theo schema; không kèm giải thích ngoài JSON.”
- “Nếu không đủ thông tin, trả về trạng thái unknown/insufficient_info với lý do.”

## 6) Đánh giá & quan sát
- Chỉ số: tỉ lệ JSON hợp lệ; tỷ lệ vi phạm schema; latency; chi phí/token; mức độ bám dữ liệu (factuality trên bộ câu hỏi kiểm thử).
- Bộ kiểm thử: regression suite với prompt cố định + expected JSON; trường hợp thiếu dữ liệu; trường hợp adversarial (prompt injection/jailbreak).
- Quan trắc sản xuất: log lỗi parse/validation; thống kê trường hay thiếu; heatmap độ dài phản hồi vs max_tokens.
- A/B prompt/model: so sánh các biến thể prompt, schema, temperature; lưu phiên bản để truy xuất.

### Kịch bản test gợi ý
- Đủ dữ liệu, case chuẩn: kỳ vọng JSON hợp lệ, đủ trường.
- Thiếu lĩnh vực/chứng chỉ: JSON hợp lệ, có flag “missing_certification”.
- Vượt ngân sách: flag “over_budget”, điểm rate giảm.
- Prompt adversarial (tiêm lệnh): model vẫn giữ format JSON, không làm theo lệnh độc hại.
- Đầu vào dài: vẫn giữ format; không cắt mất trường bắt buộc.

## 7) Mẫu prompt khuyến nghị (rút gọn, định hướng service)
- System (ý chính):
  - Vai trò: “AI matching expert cho job–interpreter”.
  - Chỉ dùng dữ liệu cung cấp; cấm bịa; nếu thiếu trả về trạng thái unknown.
  - Phải trả JSON hợp lệ theo schema; không thêm văn bản ngoài JSON.
- User (ý chính):
  - Cung cấp job (title, description, required_languages, domains, salary_range, yêu cầu khác).
  - Cung cấp interpreter (languages + level, specializations, experience_years, hourly_rate, certifications, ratings).
  - Tiêu chí: ưu tiên ngôn ngữ, chuyên ngành, kinh nghiệm tối thiểu, trần ngân sách, ngưỡng điểm tối thiểu.
- Output (gợi ý schema):
  - overall_score (0-100), score_level (excellent/good/fair/poor)
  - reasons[] {category, score, explanation}, strengths[], weaknesses[]
  - recommendation (string), match_priority (int), flags (thiếu dữ liệu, vượt ngân sách)
  - processing_notes (optional)
- CoT ẩn: “Hãy suy luận nội bộ, sau đó chỉ trả JSON cuối cùng”.

### Ví dụ prompt (rút gọn, minh họa)
- System: “Bạn là AI matching expert… Chỉ dùng dữ liệu cung cấp. Nếu thiếu, nêu rõ trong flags. Trả về JSON hợp lệ theo schema: …”
- User: kèm job, interpreters, tiêu chí ưu tiên, ngưỡng điểm, ràng buộc ngân sách. Cuối prompt: “Trả về đúng một JSON hợp lệ, không văn bản khác.”

## 8) Nguyên tắc thực hành tốt
- Ngắn gọn nhưng đủ dữ liệu: ưu tiên trường quan trọng; tránh prompt phình to gây cắt ngữ cảnh.
- Kiểm soát phiên bản: lưu template prompt, schema, tham số model để so sánh/hồi quy.
- Fail-soft: khi thiếu dữ liệu, trả JSON hợp lệ với trạng thái/lý do; không trả rỗng hoặc văn bản tự do.
- Bảo mật: không log API key; làm mờ PII; tuân thủ `.env`/`.gitignore`; hạn chế log raw payload nếu chứa PII.
- Minh bạch: nếu dùng RAG, có thể thêm trường nguồn (source_refs) để giải thích ngắn gọn.

### Rủi ro và biện pháp
- Ảo giác nội dung: dùng grounding/RAG + guardrails; kiểm tra flags; giảm temperature.
- Trượt format JSON: bật JSON mode/grammar, thêm ví dụ sai/đúng, hậu kiểm + repair.
- Quá dài/cắt ngữ cảnh: rút gọn prompt, tóm tắt lịch sử, ưu tiên trường quan trọng.
- Chi phí/latency cao: chọn model hợp lý, giảm max_tokens dư thừa, batch khi thích hợp.
- Dò rỉ PII: mask trước log, không ghi key, tuân thủ .env.

## 9) Liên hệ với mã nguồn hiện tại
- `services/openai_service.py`: nơi xây prompt và gọi OpenAI; có thể tích hợp `response_format={"type": "json_object"}` (nếu model hỗ trợ) và vòng repair khi parse lỗi.
- `services/matching_service.py`: nơi tính và sắp xếp `overall_score`, `score_level`, `match_priority`; có thể bổ sung flags (thiếu dữ liệu/vượt ngân sách).
- `models/schemas.py`: định nghĩa Pydantic models; nên phản ánh schema JSON mong đợi để validator bắt lỗi sớm.
- Khi thay đổi prompt/schema: cập nhật regression tests (nếu có) và ghi phiên bản prompt để so sánh kết quả theo thời gian.

Tài liệu này đào sâu lý thuyết và nguyên tắc kết hợp LLM + prompting + structured output; dùng làm nền để viết báo cáo hoặc tinh chỉnh template/schema trong các luồng matching/score của service.

