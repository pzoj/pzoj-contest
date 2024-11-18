import Head from "next/head";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// function formatDate(time) {
// 	// return in format HH:MM:SS
// 	let hours = Math.floor(time / 3600);
// 	time %= 3600;
// 	let minutes = Math.floor(time / 60);
// 	time %= 60;
// 	let seconds = Math.floor(time);
// 	let strhours = hours < 10 ? "0" + hours : hours;
// 	let strminutes = minutes < 10 ? "0" + minutes : minutes;
// 	let strseconds = seconds < 10 ? "0" + seconds : seconds;
// 	return `${strhours}:${strminutes}:${strseconds}`;
// }

export default () => {
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
			
			<main className="bg-dark-0 w-full pt-[4.18rem] pb-[6rem] flex p-2 flex-col justify-center font-bold text-5xl text-blue-500 gap-4">
				<div className="text-5xl">Not implemented :(</div>
				
				<div className="text-3xl">This feature has been temporarily disabled while we work on fixing an internal bug.</div>
			</main>

			<Footer />
		</>
	);
};
