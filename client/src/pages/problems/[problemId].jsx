import hljs from 'highlight.js/lib/core';
import cpp from 'highlight.js/lib/languages/cpp';
import python from 'highlight.js/lib/languages/python';
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('python', python);
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import PrimaryButton from "@/components/button/PrimaryButton";
import CodeEditor from "@/components/CodeEditor";
import ProblemStatement from "@/components/ProblemStatement";
import ProblemEditorial from "@/components/ProblemEditorial";
import ProblemSubmissions from "@/components/ProblemSubmissions";
import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCode } from "@fortawesome/free-solid-svg-icons";

export default () => {
    const router = useRouter();
    const [problemId, setProblemId] = useState("");

    useEffect(() => {
        if (router.query.problemId) {
            setProblemId(router.query.problemId);
            let newlang = localStorage.getItem(router.query.problemId + "lang") || "cpp";
            setLang(newlang);
            console.log(newlang);
            console.log(localStorage.getItem(router.query.problemId + newlang));
            setVal(localStorage.getItem(router.query.problemId + newlang));
			setTimeout(() => hljs.highlightAll(), 500);
        }
    }, [router]);

    
    const [problemSubmit, setProblemSubmit] = useState(false);
    const [problemEditorial, setProblemEditorial] = useState(false);
    const [problemStatement, setProblemStatement] = useState(true);

    const [expanded, setExpanded] = useState(false);
    const [direction, setDirection] = useState(0); // 0 means next click should be clockwise; 1 means next click should be counter clockwise

    const [val, setVal] = useState("");
    const [lang, setLang] = useState("cpp");

    const [results, setResults] = useState([]);
    const [verdict, setVerdict] = useState(null);

    const handleOnChange = (newlang, newval) => {
        if (newlang != lang) {
            setLang(newlang);
            setVal(localStorage.getItem(router.query.problemId + newlang));
            localStorage.setItem(problemId + "lang", newlang);
        } else {
            setVal(newval);
            localStorage.setItem(problemId + newlang, newval);
        }
    };

    return (
        <>
            <Head>
                <title>PZOJ</title>
                <link rel="icon" href="/images/favicon.png" />
                <link rel="stylesheet" href="/css/hidescroll.css"></link>
            </Head>

            <Navbar
                className=""
                links={[
                    { text: "Home", url: "/" },
                    { text: "Problems", url: "/problems" },
                    { text: "Learn", url: "/learn" },
                    { text: "Recommended", url: "/recommended" },
                ]}
            />

            <main className="overflow-y-hidden bg-dark-0 w-full flex flex-row justify-center items-center mt-[4.18rem]">
                <div className="max-w-[40%] w-[40%] absolute top-[4.188rem] bottom-0 left-0 min-h-[100vh]">
                    <div className="ml-8 text-grey-1 w-full border-b border-border">
                        <button onClick={(e) => {
                            e.preventDefault();

                            if (!problemStatement) {
                                setProblemStatement(true);
                                setProblemEditorial(false);
                                setProblemSubmit(false);
                            }
                        }} 
                        className={`py-[0.65rem] rounded-t cursor-pointer px-4 ${problemStatement ? "text-white-0 border-border bg-dark-3" : "transition duration-200 hover:text-white-0"}`}
                        >
                            Statement
                        </button>
                        <button 
                            className={`py-[0.65rem] rounded-t cursor-pointer px-4 ${problemEditorial ? "text-white-0 border-border bg-dark-3" : "transition duration-200 hover:text-white-0"}`}
                            onClick={(e) => {
                                e.preventDefault();

                                if (!problemEditorial) {
                                    setProblemStatement(false);
                                    setProblemEditorial(true);
                                    setProblemSubmit(false);
                                }
                            }}
                        >
                            Editorial
                        </button>
                        <button 
                            className={`py-[0.65rem] rounded-t cursor-pointer px-4 ${problemSubmit ? "text-white-0 border-border bg-dark-3" : "transition duration-200 hover:text-white-0"}`}
                            onClick={(e) => {
                                e.preventDefault(); 

                                if (!problemSubmit) {
                                    setProblemStatement(false);
                                    setProblemEditorial(false);
                                    setProblemSubmit(true);
                                }
                            }}
                        >
                            Submission
                        </button>
                    </div>

                    {problemStatement &&
                        <div>
                            <ProblemStatement pid={problemId} />
                        </div>
                    }

                    {problemEditorial &&
                        <div>
                            <ProblemEditorial />
                        </div>
                    }

                    {problemSubmit &&
                        <div>
                            <ProblemSubmissions verdict={verdict} data={results} pid={problemId} />
                        </div>
                    }
                </div>

                <div className="absolute top-[4.188rem] bottom-0 right-0 w-[60%] max-w-[60%] max-h-[calc(100%-120px)] px-8">
                    <CodeEditor val={val} lang={lang} onChange={handleOnChange} />
                </div>

                <div className="fixed bottom-[2rem] right-[4rem]">
                    <PrimaryButton
                        link="/"
                        target="_self"
                        text={
                            <span className="flex flex-row justify-center items-center">
                                <FontAwesomeIcon icon={faCode} className="inline-block text-xl w-[1.2rem] mr-2" /> Submit
                            </span>
                        }
                        bgColor="dark-1"
                        onClick={(e) => {
                            e.preventDefault();
                            setResults([]);
                            results.length = 0;
                            setProblemEditorial(false);
                            setProblemStatement(false);
                            setProblemSubmit(true);
                            setVerdict(null);
                            let token = localStorage.getItem("token");
                            if (!token) {
                                router.push("/account");
                                return;
                            }
                            let ws = new WebSocket("ws://" + window.location.host + "/ws");
                            ws.onopen = () => {
                                ws.send(JSON.stringify({
                                    pid: problemId,
                                    lang: lang,
                                    code: val,
                                    token: token
                                }));
                            };
                            ws.onmessage = (msg) => {
                                msg = msg.data;
                                if (msg.startsWith("error:") || msg.startsWith("IE")) {
                                    console.error(msg);
                                    return;
                                }
                                msg = msg.split(" ");
                                if (msg[0] == "FIN") {
                                    setVerdict(msg[1]);
                                    return;
                                }
                                msg = {
                                    verdict: msg[0],
                                    memory: msg[1],
                                    time: msg[2],
                                };
                                results.push(msg);
                                setResults([...results]);
                            };
                        }}
                    />
                </div>
            </main>
        </>
    );
};