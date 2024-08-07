import { useEffect, useState, useRef } from "react";

const ProblemSubmissions = (props) => {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.scroll(0, ref.current.scrollHeight);
        }
    }, [props.data, props.verdict]);

    return (
        <div ref={ref} className="w-full px-8 pt-4 pb-8 overflow-y-scroll max-h-[calc(100vh-112px)]">
            <h1 className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-sky-500 font-bold text-4xl">Submission</h1>
            <hr className="border-b border-border my-4" />


            <table className="w-full">
                <thead>
                    <tr className="text-grey-1">
                        <th className="pb-3">Test Case</th>
                        <th className="pb-3">Time</th>
                        <th className="pb-3">Memory</th>
                        <th className="pb-3">Verdict</th>
                    </tr>
                </thead>

				<h1 className={`text-center text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-sky-500 ${props.data.length == 0 ? "text-center" : "hidden"}`}>
					Pending judgement...
				</h1>

                <tbody className="border-t border-border">
                    {
                        props.data.map((test, idx) => {
                            return (
                                <tr key={idx} className={`text-center text-grey-1 ${idx & 1 && "bg-dark-2"}`}>
                                    <td className="py-3">{idx + 1}</td>
                                    <td className="py-3">{test.verdict == "TLE" ? ">" : ""}{test.time / 1000}s</td>
                                    <td className="py-3">{(test.memory / 1024).toFixed(2)}MB</td>
                                    <td className={`py-3 ${test.verdict == "AC" ? "text-emerald-400" : "text-red-500"}`}>{test.verdict}</td>
                                </tr>
                            );
                        })
                    }
                    {props.verdict ? (
                        <>
                            <tr className="text-2xl w-full text-center text-grey-1"><td>&nbsp;</td></tr>
                            <tr className="text-2xl w-full text-center text-grey-1">
                                <td className="py-3">Verdict: <span className={`py-3 ${props.verdict == "AC" ? "text-emerald-400" : "text-red-500"}`}>{props.verdict}</span></td>
                            </tr>
                        </>
                    ) : null}
                </tbody>
            </table>
        </div>
    );
}

export default ProblemSubmissions;