import axios from "axios";
import Head from "next/head";
import Navbar from "@/components/Navbar";
import Table from "@/components/Table";
import PrimaryButton from "@/components/button/PrimaryButton";
import Footer from "@/components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShuffle, faSearch, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useRef } from "react";

export default () => {
	const [problems, setProblems] = useState([]);
	const [query, setQuery] = useState("");

	useEffect(() => {
		axios.get("/api/problems").then(async (res) => {
			let problemList = res.data.map(async (p) => {
				return {
					status: Boolean((await axios.get(`/api/problem/${p.pid}/status`)).data),
					problemTitle: p.title,
					rating: p.difficulty,
					problemLink: `/problems/${p.pid}`,
					tag: p.tag,
				};
			});
			problemList = await Promise.all(problemList);
			problemList.sort((a, b) => {
				if (a.rating < b.rating)
					return -1;
				else if (a.rating > b.rating)
					return 1;
				else
					return 0;
			});
			setProblems(problemList);
		}).catch((err) => {
			console.error(err);
		});
	}, []);

	return (
		<>
			<Head>
				<title>PZOJ</title>
				<link rel="icon" href="/images/favicon.png" />
			</Head>

			<Navbar
				links={[
					{ text: "Home", url: "/" },
					{ text: "Problems", url: "/problems" },
					{ text: "Learn", url: "/learn" },
					{ text: "Recommended", url: "/recommended" },
				]}
			/>

			<main className="bg-dark-0 w-full">
				<div className="flex flex-row justify-center items-start relative w-4/5 mx-auto mt-[10rem] mb-[6rem]">
					<div className="grow px-10">
						<h1 className="mb-[2rem] text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-sky-500 font-bold text-4xl">Problems</h1>
						<Table
							data={problems}
						/>
					</div>

					<div className="min-w-[25rem] mt-[4.5rem] px-10 flex flex-col justify-center items-start sticky top-[6rem]">
						<div className="bg-dark-1 rounded px-[1.5rem] py-[1.5rem] border border-border w-full mb-[1rem]">
							<h2 className="text-grey-1 text-xl font-semibold mb-[1rem]">Find a Problem:</h2>
							<div className="text-grey-1 bg-dark-2 px-4 py-2 border border-border flex flex-row justify-center items-center rounded-lg">
								<FontAwesomeIcon icon={faSearch} className="text-xl inline-block w-[1.2rem] mr-4" />
								<input
									type="text"
									value={query}
									onChange={(e) => setQuery(e.currentTarget.value)}
									className="outline-none bg-dark-2 mr-4 w-[12rem]"
									placeholder="Search for a problem"
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											// click the button	
											document.querySelector(".search-button").click(); // this is very scuffed @frontend help me
										}
									}}
								/>

								<PrimaryButton
									link="/problems"
									text={
										<span>
											<FontAwesomeIcon icon={faArrowRight} className="inline-block text-xl mt-[-0.23rem] w-[1rem] mr-0.5" /> Go
										</span>
									}
									target="_self"
									bgColor="dark-2"
									className="search-button"
									onClick={(e) => {
										e.preventDefault();
										axios.get(`/api/problems?q=${query}`).then(async (res) => {
											let problemList = res.data.map(async (p) => {
												return {
													status: Boolean(await axios.get(`/api/problem/${p.pid}/status`).data),
													problemTitle: p.title,
													rating: p.difficulty,
													problemLink: `/problems/${p.pid}`,
													tag: p.tag,
												};
											});
											setProblems(await Promise.all(problemList));
										}).catch((err) => {
											if (err.response.status === 500) {
												// server died
												return;
											} else {
												console.error(err);
											}
										});
									}}
								/>
							</div>
						</div>

						<div className="bg-dark-1 rounded px-[1.5rem] py-[1.5rem] border border-border w-full">
							<h2 className="text-grey-1 text-xl font-semibold mb-[1rem]">Random Problem:</h2>

							<PrimaryButton
								link="/api/problems/random"
								onClick={(e) => {
									e.preventDefault();
									window.open("/api/problems/random");
								}}
								target="_self"
								text={
									<span><FontAwesomeIcon icon={faShuffle} className="text-xl inline-block w-[1.2rem] mt-[-0.23rem] mr-0.5" /> Random</span>
								}
								bgColor="dark-1"
							/>

						</div>
					</div>
				</div>
			</main>

			<Footer />
		</>
	);
};
