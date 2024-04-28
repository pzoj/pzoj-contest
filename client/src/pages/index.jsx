import Head from "next/head";
import Image from "next/image";
import Dice from "@/components/Dice";
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
								<h1 className="z-[100] text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-sky-500">
									Master
								</h1>
								<h1 className="z-[100] text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-sky-500">
									Competitive
								</h1>
								<h1 className="z-[100] text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-sky-500">
									Programming
								</h1>
							</div>

							<p className="text-grey-1 text-xl">
								An online judge that helps you learn as you do problems.
							</p>
						</div>

						<div className="w-[40rem] h-[40rem] relative ml-[4rem] z-[0]">
							<Canvas className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center">
								<OrbitControls />
								<ambientLight args={["#ffffff", 0.5]} />
								<directionalLight
									args={["#ffffff", 0.5]}
									position={[-3, 8, 1]}
								/>
								<Dice />
							</Canvas>
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
								<h2 className="block cock text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-sky-500 mb-6">
									Inner
									<br />
									Mechanisms
								</h2>
								<p className="block cock text-grey-1 text-xl max-w-[27rem]">
									By recommending problems based on what you've struggled on and
									areas you're unfamiliar with, this is the perfect tool to get
									started with competitive programming with.
								</p>
							</div>
{/* 
							<Image
								src="/images/image.png"
								className="border-2 border-border"
								width={400}
								height={1200}
							/> */}
						</div>
					</div>
					{/* We offer built courses for all
								skill levels, which combined with our elaborate editorials allow
								anyone to understand a problem, even without previous knowledge. */}
				</div>
			</main>

			<Footer />
		</>
	);

	// const [random, setRandom] = useState("Dynamic Programming.");
	// useEffect(() => {
	// 	setInterval(() => {
	// 		const list = [
	// 			"Dynamic Programming.", "Tree Algorithms.", "Graph Theory.", "Binary Search.", "Heaps.", "Dijkstra's Algorithm.",
	// 			"Priority Queues.", "Sparse Tables.", "Segment Trees.", "Greedy Algorithms.", "Bellman-Ford Algorithm.", "Max Flow.",
	// 			"Two Pointers System.", "Sliding Window.", "Kruskal's Algorithm.", "Tabulation.", "Square Root Decomposition.",
	// 			"Binary Indexed Tree.", "Trie.", "Disjoint Set Union.", "Breadth First Search.", "Depth First Search.", "Convex Hull.",
	// 			"Sieve of Eratosthenes.", "Fast Fourier Transform.", "Z-Algorithm.", "Kosaraju's Algorithm.", "Longest Common Subsequence.",
	// 			"Backtracking.", "Complex Analysis.", "Modular Arithmetic.", "Number Theory.", "Divide and Conquer.", "Ternary Search.",
	// 		];
	// 		setRandom(list[Math.floor(Math.random() * 16)]);
	// 	}, 1000);
	// }, []);

	// return (
	// 	<>
	// 		<Head>
	// 			<title>PZOJ</title>
	// 			<meta
	// 				name="description"
	// 				content="Learn competitive programming and solve programming problems!"
	// 			/>
	// 			<meta
	// 				name="viewport"
	// 				content="width=device-width, initial-scale=1"
	// 			/>
	// 			<link rel="icon" href="/images/favicon.png" />
	// 		</Head>

	//         <div className="from-dark-0 to-blue-900 bg-gradient-to-b absolute z-[-1] top-[85vh] bottom-0 left-0 right-0" />
	// 		<main className="flex flex-col justify-center items-center">
	// 			<Navbar
	// 				className=""
	// 				links={[
	// 					{ text: "Home", url: "/" },
	// 					{ text: "Problems", url: "/problems" },
	// 					{ text: "Learn", url: "/learn" },
	// 					{ text: "Recommended", url: "/recommended" },
	// 				]}
	// 			/>

	// 			<div className="pt-[4rem] ml-[7rem]">
	// 				<h1 className="text-grey-2 text-7xl font-bold ml-[2rem] mt-[2rem] mr-[55%]">Master Competitive Programming.</h1>
	// 				<p className="text-grey-1 mt-[1rem] bottom-[2rem] ml-[2rem] mr-[64%] text-lg leading-[3rem]">
	// 					An online judge that helps you learn as you do problems. By recommending problems based on what you've struggled on and areas you're unfamiliar with, this is the perfect tool to get started with competitive programming with. We offer built courses for all skill levels, which combined with our elaborate editorials allow anyone to understand a problem, even without previous knowledge.
	// 				</p>
	// 			</div>
	// 			<div className="absolute top-[2rem] bottom-0 right-0 left-[30vw] flex justify-center items-center">
	// 				<Canvas className="mb-[5rem]">
	// 					<OrbitControls />
	// 					<ambientLight args={["#ffffff", 0.5]} />
	// 					<directionalLight args={["#ffffff", 0.5]} position={[-3, 8, 1]} />
	// 					<Dice />
	// 				</Canvas>

	// 			</div>
	//             <div className="absolute top-[4rem] bottom-0 right-0 left-[30vw] flex justify-center items-center">
	//                 <p1 className="text-grey-2 z-[99] text-4xl mt-[30rem] font-bold">{random}</p1>
	//             </div>
	// 		</main>
	// 	</>
	// );
};
