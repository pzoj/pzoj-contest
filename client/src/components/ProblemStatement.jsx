import { useRouter } from "next/router";
import { InlineTex } from "react-tex";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faCaretDown, faCaretUp } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

export default (props) => {
	const router = useRouter();
	const [showLimits, setShowLimits] = useState(true);
	const [showTags, setShowTags] = useState(false);
	const [tags, setTags] = useState("");
	const [content, setContent] = useState("");
	const [difficulty, setDifficulty] = useState(0);
	const [time, setTime] = useState(0);
	const [memory, setMemory] = useState(0);

	useEffect(() => {
		const problemId = router.query.problemId;
		if (!problemId) return;
		axios.get(`/api/problem/${problemId}/meta`).then((res) => {
			setTags([res.data.tag]);
			setDifficulty(parseInt(res.data.difficulty));
			setTime(parseInt(res.data.time) / 1000);
			setMemory(parseInt(res.data.memory));
		}).catch((err) => {
			console.error(err);
		});
		axios.get(`/api/problem/${problemId}`).then((res) => {
			setContent(res.data);
		}).catch((err) => {
			console.error(err);
		});
	}, [router]);

	return (
		<>
			<div className="w-full px-8 pt-4 pb-8 overflow-y-scroll max-h-[calc(100vh-112px)]" id="problem-statement-container">
				<div className="flex flex-row justify-start items-center">
					<p1 className="inline-block text-grey-1">Difficulty: </p1>
					<p1 className="inline-block text-yellow-200 mx-1">{difficulty}</p1>
					<FontAwesomeIcon icon={faStar} className="text-yellow-200 text-xl inline w-[1.2rem]" />
				</div>

				<hr className="border-b border-border my-[1rem]" />

				<div id="problem-statement" >
					<InlineTex texSeperator="${1}" texContent={content} />
				</div>

				<hr className="mt-8 mb-3 border-b border-border" />

				<div>
					<div
						className="flex flex-row justify-between items-center cursor-pointer mb-2 group"
						onClick={(e) => {
							setShowLimits((prev) => !prev);
						}}
					>
						<span className="inline-block text-grey-1 transition duration-200 group-hover:text-white-0">Limits:</span>

						<FontAwesomeIcon
							icon={faCaretUp}
							className={`text-grey-1 inline-block text-xl w-[0.7rem] ${!showLimits && "rotate-180"}`}
						/>
					</div>

					{showLimits &&
						<ul className="list-disc">
							<li className="text-grey-1 block">Time Limit: <span className="text-blue-1">{time}s</span></li>
							<li className="text-grey-1 block">Memory Limit: <span className="text-blue-1">{memory}MB</span></li>
						</ul>
					}
				</div>

				<hr className="my-3 border-b border-border" />

				<div>
					<div
						className="flex flex-row justify-between items-center cursor-pointer mb-2 group"
						onClick={(e) => {
							setShowTags((prev) => !prev);
						}}
					>
						<span className="inline-block text-grey-1 transition duration-200 group-hover:text-white-0">Related Tags:</span>

						<FontAwesomeIcon
							icon={faCaretDown}
							className={`text-grey-1 inline-block text-xl w-[0.7rem] ${showTags && "rotate-180"}`}
						/>
					</div>

					{showTags ?
						tags.map((tag, idx) => <span key={idx} className={`${idx & 1 && "mx-2"} border-2 border-emerald-400 rounded-xl px-2 py-1 text-emerald-400 text-xs`}>{tag}</span>) : ""
					}
				</div>
			</div>
		</>
	);
};