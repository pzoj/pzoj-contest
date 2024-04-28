import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

const languages = {
    cpp: "cpp",
    c: "c",
    py: "python",
    java: "java",
};

const CodeEditor = (props, ref) => {
    const [lang, setLang] = useState("cpp");
    const [val, setVal] = useState("");
    const selectRef = useRef();

    useEffect(() => {
        setVal(props.val);
        setLang(props.lang || "cpp");
        selectRef.current.value = props.lang || "cpp";
    }, [props.val]);

    return (
        <div className="rounded-md w-full h-full shadow-4xl" id="code-editor">
            <div className="border-none w-full">
                <select
                    className="border-none bg-inherit outline-none text-grey-1"
                    onChange={(e) => {
                        setLang(e.target.value);
                        props.onChange(e.target.value, val);
                    }}
                    ref={selectRef}>
                    <option value="cpp">C++20</option>
                    <option value="c">GNU C11</option>
                    <option value="py">Python3</option>
                    <option value="java">Java</option>
                </select>
            </div>

            <Editor
                language={languages[lang]}
                theme={"vs-dark"}
                value={val}
                onChange={(e) => {
                    setVal(e);
                    props.onChange(lang, e);
                }}
                ref={ref}
                line={1}
                className="border border-border rounded"
            />
        </div>
    );
};

export default CodeEditor;