flowchart LR
subgraph "Current State (MVP)"
M1[✅ Smooth Pan/Zoom]
M2[✅ Delete Function]
M3[⚠️ Single Rectangle Only]
M4[❌ No Text]
M5[❌ Single Select Only]
M6[❌ Move Only]
M7[❌ No Layers]
M8[❌ No Duplicate]
end

    subgraph "Target State (Excellent)"
        T1[✅ Smooth Pan/Zoom]
        T2[✅ 3+ Shape Types]
        T3[✅ Text with Formatting]
        T4[✅ Multi-Select]
        T5[✅ Transform Operations]
        T6[✅ Layer Management]
        T7[✅ Duplicate/Delete]
    end

    M1 -.-> T1
    M3 --> PR9[PR #9] --> T2
    M4 --> PR10[PR #10] --> T3
    M5 --> PR11[PR #11] --> T4
    M6 --> PR12[PR #12] --> T5
    M7 --> PR13[PR #13] --> T6
    M8 --> PR14[PR #14] --> T7

    style T1 fill:#55efc4
    style T2 fill:#55efc4
    style T3 fill:#55efc4
    style T4 fill:#55efc4
    style T5 fill:#55efc4
    style T6 fill:#55efc4
    style T7 fill:#55efc4
