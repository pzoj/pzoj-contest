import Head from "next/head";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default () => {
	return (
		<>
			<Head>
				<title>PZOJ - Contest Instance</title>
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
					{ text: "Contest", url: "/contest" },
					{ text: "Problems", url: "/problems" }
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
								Welcome to the PZOJ Contest Instance.
							</p>
						</div>

						<div className="w-[40rem] h-[40rem] relative ml-[4rem] z-[0] flex items-center justify-center">
							<Image src="/images/favicon.png" width={400} height={400} />
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
				</div>
			</main>

			<Footer />
		</>
	);
};
