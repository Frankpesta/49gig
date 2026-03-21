export interface Country {
  code: string;
  name: string;
  flag: string;
  phoneCode: string;
}

export const countries: Country[] = [
  { code: "US", name: "United States", flag: "🇺🇸", phoneCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", phoneCode: "+44" },
  { code: "CA", name: "Canada", flag: "🇨🇦", phoneCode: "+1" },
  { code: "AU", name: "Australia", flag: "🇦🇺", phoneCode: "+61" },
  { code: "DE", name: "Germany", flag: "🇩🇪", phoneCode: "+49" },
  { code: "FR", name: "France", flag: "🇫🇷", phoneCode: "+33" },
  { code: "IT", name: "Italy", flag: "🇮🇹", phoneCode: "+39" },
  { code: "ES", name: "Spain", flag: "🇪🇸", phoneCode: "+34" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", phoneCode: "+31" },
  { code: "BE", name: "Belgium", flag: "🇧🇪", phoneCode: "+32" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", phoneCode: "+41" },
  { code: "AT", name: "Austria", flag: "🇦🇹", phoneCode: "+43" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", phoneCode: "+46" },
  { code: "NO", name: "Norway", flag: "🇳🇴", phoneCode: "+47" },
  { code: "DK", name: "Denmark", flag: "🇩🇰", phoneCode: "+45" },
  { code: "FI", name: "Finland", flag: "🇫🇮", phoneCode: "+358" },
  { code: "PL", name: "Poland", flag: "🇵🇱", phoneCode: "+48" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", phoneCode: "+353" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", phoneCode: "+351" },
  { code: "GR", name: "Greece", flag: "🇬🇷", phoneCode: "+30" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿", phoneCode: "+420" },
  { code: "RO", name: "Romania", flag: "🇷🇴", phoneCode: "+40" },
  { code: "HU", name: "Hungary", flag: "🇭🇺", phoneCode: "+36" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬", phoneCode: "+359" },
  { code: "HR", name: "Croatia", flag: "🇭🇷", phoneCode: "+385" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰", phoneCode: "+421" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮", phoneCode: "+386" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹", phoneCode: "+370" },
  { code: "LV", name: "Latvia", flag: "🇱🇻", phoneCode: "+371" },
  { code: "EE", name: "Estonia", flag: "🇪🇪", phoneCode: "+372" },
  { code: "JP", name: "Japan", flag: "🇯🇵", phoneCode: "+81" },
  { code: "CN", name: "China", flag: "🇨🇳", phoneCode: "+86" },
  { code: "IN", name: "India", flag: "🇮🇳", phoneCode: "+91" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", phoneCode: "+82" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", phoneCode: "+65" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", phoneCode: "+60" },
  { code: "TH", name: "Thailand", flag: "🇹🇭", phoneCode: "+66" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", phoneCode: "+63" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", phoneCode: "+62" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", phoneCode: "+84" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼", phoneCode: "+886" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰", phoneCode: "+852" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", phoneCode: "+64" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", phoneCode: "+27" },
  { code: "EG", name: "Egypt", flag: "🇪🇬", phoneCode: "+20" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", phoneCode: "+254" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", phoneCode: "+234" },
  { code: "GH", name: "Ghana", flag: "🇬🇭", phoneCode: "+233" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", phoneCode: "+55" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", phoneCode: "+52" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", phoneCode: "+54" },
  { code: "CL", name: "Chile", flag: "🇨🇱", phoneCode: "+56" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", phoneCode: "+57" },
  { code: "PE", name: "Peru", flag: "🇵🇪", phoneCode: "+51" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", phoneCode: "+58" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", phoneCode: "+971" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", phoneCode: "+966" },
  { code: "IL", name: "Israel", flag: "🇮🇱", phoneCode: "+972" },
  { code: "TR", name: "Turkey", flag: "🇹🇷", phoneCode: "+90" },
  { code: "RU", name: "Russia", flag: "🇷🇺", phoneCode: "+7" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦", phoneCode: "+380" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", phoneCode: "+92" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩", phoneCode: "+880" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰", phoneCode: "+94" },
  { code: "NP", name: "Nepal", flag: "🇳🇵", phoneCode: "+977" },
  { code: "MM", name: "Myanmar", flag: "🇲🇲", phoneCode: "+95" },
  { code: "KH", name: "Cambodia", flag: "🇰🇭", phoneCode: "+855" },
  { code: "LA", name: "Laos", flag: "🇱🇦", phoneCode: "+856" },
  { code: "MN", name: "Mongolia", flag: "🇲🇳", phoneCode: "+976" },
  { code: "KZ", name: "Kazakhstan", flag: "🇰🇿", phoneCode: "+7" },
  { code: "UZ", name: "Uzbekistan", flag: "🇺🇿", phoneCode: "+998" },
  { code: "GE", name: "Georgia", flag: "🇬🇪", phoneCode: "+995" },
  { code: "AM", name: "Armenia", flag: "🇦🇲", phoneCode: "+374" },
  { code: "AZ", name: "Azerbaijan", flag: "🇦🇿", phoneCode: "+994" },
  { code: "BY", name: "Belarus", flag: "🇧🇾", phoneCode: "+375" },
  { code: "MD", name: "Moldova", flag: "🇲🇩", phoneCode: "+373" },
  { code: "RS", name: "Serbia", flag: "🇷🇸", phoneCode: "+381" },
  { code: "BA", name: "Bosnia and Herzegovina", flag: "🇧🇦", phoneCode: "+387" },
  { code: "MK", name: "North Macedonia", flag: "🇲🇰", phoneCode: "+389" },
  { code: "AL", name: "Albania", flag: "🇦🇱", phoneCode: "+355" },
  { code: "ME", name: "Montenegro", flag: "🇲🇪", phoneCode: "+382" },
  { code: "IS", name: "Iceland", flag: "🇮🇸", phoneCode: "+354" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺", phoneCode: "+352" },
  { code: "MT", name: "Malta", flag: "🇲🇹", phoneCode: "+356" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾", phoneCode: "+357" },
  { code: "LI", name: "Liechtenstein", flag: "🇱🇮", phoneCode: "+423" },
  { code: "MC", name: "Monaco", flag: "🇲🇨", phoneCode: "+377" },
  { code: "SM", name: "San Marino", flag: "🇸🇲", phoneCode: "+378" },
  { code: "VA", name: "Vatican City", flag: "🇻🇦", phoneCode: "+39" },
  { code: "AD", name: "Andorra", flag: "🇦🇩", phoneCode: "+376" },
];

/** Country list sorted A–Z by name (for selects). */
export const countriesAlphabetical: Country[] = [...countries].sort((a, b) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
);

export function getCountryByCode(code: string): Country | undefined {
  return countries.find((c) => c.code === code);
}

export function getCountryByPhoneCode(phoneCode: string): Country | undefined {
  return countries.find((c) => c.phoneCode === phoneCode);
}
