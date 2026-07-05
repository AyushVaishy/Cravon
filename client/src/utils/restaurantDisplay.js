/** Shared restaurant card display helpers (home, search, profile). */

export const getOfferLabel = (resData) => resData?.offerTag?.trim() || null;

export const getClosingStatus = (openingTime, closingTime) => {
  if (!openingTime || !closingTime) return { isOpenNow: true, closingIn: null };

  const parseTime = (t) => {
    if (!t) return null;
    const s = t.toString().trim().toUpperCase();
    const pm = s.includes("PM");
    const am = s.includes("AM");
    const cleaned = s.replace(/[APM\s]/g, "");
    const [h, m = "0"] = cleaned.split(":");
    let hour = parseInt(h, 10);
    const min = parseInt(m, 10);
    if (pm && hour !== 12) hour += 12;
    if (am && hour === 12) hour = 0;
    return hour * 60 + min;
  };

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const open = parseTime(openingTime);
  const close = parseTime(closingTime);
  if (open === null || close === null) return { isOpenNow: true, closingIn: null };

  const isOpenNow = nowMins >= open && nowMins < close;
  const closingIn = isOpenNow ? close - nowMins : null;
  return { isOpenNow, closingIn };
};

export const RestaurantStatusBadges = ({ resData, className = "" }) => {
  const closed = resData.isOpen === false;
  const offer = !closed ? getOfferLabel(resData) : null;
  const { isOpenNow, closingIn } = getClosingStatus(resData.openingTime, resData.closingTime);
  const closingSoon = !closed && isOpenNow && closingIn != null && closingIn <= 60;

  return (
    <div className={`absolute top-2 left-2 flex flex-col gap-1 items-start z-[1] ${className}`}>
      {closed && (
        <span className="bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wide">
          Closed
        </span>
      )}
      {!closed && offer && (
        <span className="bg-primary/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow">
          🏷 {offer}
        </span>
      )}
      {closingSoon && (
        <span className="bg-amber-500/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow">
          Closes in {closingIn}m
        </span>
      )}
    </div>
  );
};
