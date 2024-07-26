import React from 'react';

const SeasonInfo = () => {
    return (
    <div className="SeasonInfo w-96 h-24 left-[120px] top-[200px] absolute">
        <div className="PlayerCount w-32 h-16 left-[1072px] top-[17px] absolute justify-start items-center gap-2 inline-flex">
            <img className="SeasonPlayerImage w-16 h-16" src="https://via.placeholder.com/63x63" />
            <div className="SeasonNumplayers text-black text-3xl font-medium font-['Inter'] leading-10">420</div>
        </div>
            <div className="TournamentCount w-28 h-12 left-[869px] top-[25px] absolute justify-center items-center gap-3 inline-flex">
            <img className="League1TournamentImage w-16 h-16" src="https://via.placeholder.com/63x63" />
            <div className="League1Numtournaments text-black text-3xl font-medium font-['Inter'] leading-10">72</div>
        </div>
            <div className="LeagueDates w-96 h-12 left-[423px] top-[25px] absolute justify-start items-start gap-3 inline-flex">
            <img className="SeasonDateImage w-10 h-12" src="https://via.placeholder.com/42x47" />
            <div className="SeasonDate text-black text-3xl font-medium font-['Inter'] leading-10">04/01/24 - 06/30/24</div>
        </div>
            <div className="SeasonName w-80 h-24 left-0 top-0 absolute justify-start items-center gap-6 inline-flex">
            <img className="SeasonPfp w-24 h-24 rounded-full border-2 border-black" src="https://via.placeholder.com/98x98" />
            <div className="SeasonName text-black text-5xl font-medium font-['Inter'] leading-10">Q2 2024</div>
        </div>
    </div>
    )
}

export default SeasonInfo;