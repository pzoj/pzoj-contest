import axios from "axios";
import Head from "next/head";
import Navbar from "@/components/Navbar";
import Table from "@/components/Table";
import PrimaryButton from "@/components/button/PrimaryButton";
import Footer from "@/components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShuffle, faSearch, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useRef } from "react";
import { InlineTex } from "react-tex";
import Leaderboard from "@/components/Leaderboard";

function formatDate(time) {
	// return in format HH:MM:SS
	let hours = Math.floor(time / 3600);
	time %= 3600;
	let minutes = Math.floor(time / 60);
	time %= 60;
	let seconds = Math.floor(time);
	let strhours = hours < 10 ? "0" + hours : hours;
	let strminutes = minutes < 10 ? "0" + minutes : minutes;
	let strseconds = seconds < 10 ? "0" + seconds : seconds;
	return `${strhours}:${strminutes}:${strseconds}`;
}

export default () => {
	const [contestDescription, setContestDescription] = useState("");
	const [endTime, setEndTime] = useState(0);
	const [curTime, setCurTime] = useState(Date.now()/1000);
	const [leaderboard, setLeaderboard] = useState([]);
	const [isClient, setIsClient] = useState(false);
	useEffect(() => {
		axios.get("/api/contest").then(async (res) => {
			setContestDescription(res.data);
		}).catch((err) => {
			console.error(err);
		});
		axios.get("/api/contest/meta").then(async (res) => {
			setEndTime(parseInt(res.data.end));
		});
		const interval = setInterval(() => {
			setCurTime(Date.now()/1000);
		}, 1000);
		axios.get("/api/contest/leaderboard").then(async (res) => {
			setLeaderboard(res.data);
		}).catch((err) => {
			console.error(err);
		});
		setIsClient(true);
		return () => clearInterval(interval);
	}, []);

	return (
		<>
			<Head>
				<title>PZOJ</title>
				<link rel="icon" href="/images/favicon.png" />
			</Head>

			<Navbar
				links={[
					{ text: "Contest", url: "/contest" },
					{ text: "Problems", url: "/problems" }
				]}
			/>

			<main className="bg-dark-0 w-full">
				<div className="flex flex-row justify-center items-start relative w-4/5 mx-auto mt-[10rem] mb-[6rem]">
					<div className="grow px-10">
						<div id="problem-statement">
							<InlineTex texSeperator="${1}" texContent={contestDescription} />
						</div>
					</div>
				</div>
			</main>

			<div className="flex justify-center mb-[2rem] text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-sky-500 font-bold text-4xl">
				{/* <h1>Time Left: {formatDate(endTime - (Date.now()/1000))}</h1> */}
				<h1>{isClient ? `Time Left: ${formatDate(endTime - curTime)}` : "Loading..."}</h1>
			</div>
			
			<div className="flex justify-center mb-[2rem] text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-sky-500 font-bold text-4xl">
				<h1>Leaderboard</h1>
			</div>
			
			<Leaderboard users={leaderboard} />

			<Footer />
		</>
	);
};
