import Head from "next/head";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState, useEffect } from "react";

export default () => {
	return (
		<>
			<Head>
				<title>PZOJ</title>
				<meta
					name="description"
					content="Learn competitive programming and solve programming problems!"
				/>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/images/favicon.png" />
			</Head>

			<Navbar
				className=""
				links={[
					{ text: "Home", url: "/" },
					{ text: "Problems", url: "/problems" },
					{ text: "About", url: "/about" }
				]}
			/>

			<main className="bg-dark-0 w-full pt-[4rem] pb-[6rem]">
				<div className="px-[10rem] mx-auto mb-[6rem]">
					<div className="flex flex-row justify-center items-center">
						<div className="fixed top-0 bottom-0 right-0 left-0 z-[1]"></div>
						<div className="mr-[4rem] z-[2]">
							<div className="mb-6">
								<h1 className="p-4 z-[100] text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-sky-500">
									PZOJ
								</h1>
							</div>

							<p className="text-grey-1 text-xl">
								An online judge created by Team int0x80, four high school students for a hackathon.
							</p>

							<p className="text-grey-1 text-xl">
								We aim to provide a platform for students to learn competitive programming and solve programming problems.
							</p>

							<br/>

							<p className="text-grey-1 text-xl">
								On the PZOJ (ez-PZ Online Judge), you can solve problems, view editorials, and track your progress.
							</p>

							<p className="text-grey-1 text-xl">
								Each problem is tagged with a difficulty level from 0 to 10, and a tag to help you understand the problem.
							</p>

							<br/>

							<p className="text-grey-1 text-xl">
								All problems are set and curated by Kevin Lu, the only remaining maintainer of this project.
							</p>

							<br/><br/>
						</div>
					</div>
				</div>

				{/* next section */}

				<div className="relative mt-[calc(250px+0rem)] mx-auto mb-[6rem]">
					<div className="absolute top-[-423.547px] left-0 right-0">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
							<path
								fill="#1c2830"
								fill-opacity="1"
								d="M0,256L48,256C96,256,192,256,288,224C384,192,480,128,576,133.3C672,139,768,213,864,234.7C960,256,1056,224,1152,213.3C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
							></path>
						</svg>
					</div>

					<div className="bg-dark-1 pt-8 pb-[6rem] px-[10rem]">
						<div className="flex flex-row justify-center items-center">
							<div>
								<h2 className="block text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-sky-500 mb-6">
									Inner
									<br />
									Mechanisms
								</h2>
								<p className="block text-grey-1 text-xl max-w-[27rem]">
									We add problems as often as we can, so you can get the most amount of practice possible!
									We also plan on supporting contests soon. Maybe I'll be able to reassemble the members of 
									team int0x80? Who knows!
								</p>

								<br/>

								<p className="block text-grey-1 text-xl max-w-[27rem]">
									Problems are rated on a difficulty scale from 0 to 10:
								</p>

								<br/>

								<p className="block text-grey-1 text-xl max-w-[27rem]">
									0-2: Very Easy - Basic programming knowledge
								</p>

								<br/>

								<p className="block text-grey-1 text-xl max-w-[27rem]">
									3-4: Easy - Basic algorithms and data structures
								</p>

								<br/>

								<p className="block text-grey-1 text-xl max-w-[27rem]">
									5-6: Medium - Intermediate algorithms and data structures
								</p>

								<br/>

								<p className="block text-grey-1 text-xl max-w-[27rem]">
									7-8: Hard - Advanced algorithms and data structures
								</p>

								<br/>

								<p className="block text-grey-1 text-xl max-w-[27rem]">
									9-10: Very Hard - Extremely difficult problems
								</p>
							</div>
						</div>
					</div>
				</div>
			</main>

			<Footer />
		</>
	);
};
