import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import PrimaryButton from "./button/PrimaryButton";
import DangerButton from "./button/DangerButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle } from "@fortawesome/free-regular-svg-icons";

function tokenName() {
	if (typeof window === "undefined") return null;
	let token = localStorage.getItem("token");
	if (!token) return null;
	token = token.split(".")[0];
	token = JSON.parse(atob(token));
	if (parseInt(token.expiration) * 1000 < Date.now()) return null;
	return token.username;
}

const Navbar = (props) => {
	const [username, setUsername] = useState(null);
	const [showSettings, setShowSettings] = useState(false);

	useEffect(() => {
		let newusername = tokenName();
		if (newusername === null) {
			localStorage.removeItem("token");
			return;
		}
		setUsername(newusername);
	}, []);

	return (
		<nav className="z-[99] border-b border-border fixed top-0 left-0 right-0">
			<div className="relative w-full bg-dark-2 px-10 py-4 flex justify-start items-center">
				<div className="logo">
					<Link
						href="/"
						className="opacity-100 transition duration-200 hover:opacity-70"
					>
						<Image src="/images/pzoj.png" width="35" height="35" />
					</Link>
				</div>

				{props.links.map((link, idx) => (
					<Link
						className="text-grey-1 pl-10 transition duration-200 ease-in-out hover:text-white-0"
						href={link.url}
						key={idx}
					>
						{link.text}
					</Link>
				))}


				<div className="absolute right-10">
					{username === null ? (
						<PrimaryButton
							link="/account"
							target="_self"
							text="Login"
							bgColor="dark-2"
						/>
					) : (
						<div>
							<span className="flex flex-row justify-center items-center relative text-grey-1">
								<FontAwesomeIcon
									icon={faUserCircle}
									className={`inline-block text-grey-1 text-xl w-[1.8rem] cursor-pointer transition duration-200 hover:text-white-0 ${showSettings && "text-white-0"}`}
									onClick={() => {
										setShowSettings((prev) => !prev);
									}}
								/>
							</span>

							{showSettings && (
								<div className="fixed top-[3.3rem] right-[2.3rem] block bg-dark-1 pt-4 pb-6 px-6 border border-border rounded z-[99]">
									<div className="relative">										
										<p className="text-grey-1">
											Hello,{" "}
											<span className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-sky-500">
												{username}
											</span>
										</p>

										<hr className="border-b border-border w-full mt-3 mb-6" />
										
										<div className="m-auto w-full">
											<DangerButton
												link="/api/logout"
												target="_self"
												text="Sign Out"
												onClick={() => {
													localStorage.removeItem("token");
													setUsername(null);
												}}
											/>
										</div>
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
