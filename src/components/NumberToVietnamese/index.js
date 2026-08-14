const DIGITS = [
  "không",
  "một",
  "hai",
  "ba",
  "bốn",
  "năm",
  "sáu",
  "bảy",
  "tám",
  "chín",
];

const SCALE_UNITS = ["", "nghìn", "triệu"];

const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.trunc(value) : 0;
  }

  const normalized = String(value)
    .trim()
    .replace(/[^\d-]/g, "");

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
};

const readUnitDigit = (digit, tensDigit) => {
  if (digit === 0) {
    return "";
  }

  if (digit === 1 && tensDigit > 1) {
    return "mốt";
  }

  if (digit === 4 && tensDigit > 1) {
    return "tư";
  }

  if (digit === 5 && tensDigit > 0) {
    return "lăm";
  }

  return DIGITS[digit];
};

/**
 * Đọc một nhóm tối đa 3 chữ số.
 *
 * Ví dụ:
 * 10  => "mười"
 * 15  => "mười lăm"
 * 105 => "một trăm lẻ năm"
 * 015, khi bắt buộc đọc đủ => "không trăm mười lăm"
 */
const readThreeDigits = (
  value,
  forceHundreds = false,
  separatorWord = "lẻ",
) => {
  const number = Number(value) || 0;

  const hundreds = Math.floor(number / 100);
  const tens = Math.floor((number % 100) / 10);
  const units = number % 10;

  const words = [];

  if (hundreds > 0 || forceHundreds) {
    words.push(`${DIGITS[hundreds]} trăm`);
  }

  if (tens > 1) {
    words.push(`${DIGITS[tens]} mươi`);

    const unitText = readUnitDigit(units, tens);

    if (unitText) {
      words.push(unitText);
    }
  } else if (tens === 1) {
    words.push("mười");

    const unitText = readUnitDigit(units, tens);

    if (unitText) {
      words.push(unitText);
    }
  } else if (units > 0) {
    if (hundreds > 0 || forceHundreds) {
      words.push(separatorWord);
    }

    words.push(DIGITS[units]);
  }

  return words.join(" ").trim();
};

/**
 * Đọc một nhóm 9 chữ số:
 * xxx triệu xxx nghìn xxx
 */
const readNineDigits = (
  value,
  forceLowerGroups = false,
  separatorWord = "lẻ",
) => {
  const number = Number(value) || 0;

  const millionGroup = Math.floor(number / 1_000_000);
  const thousandGroup = Math.floor((number % 1_000_000) / 1_000);
  const unitGroup = number % 1_000;

  const words = [];

  if (millionGroup > 0) {
    words.push(`${readThreeDigits(millionGroup, false, separatorWord)} triệu`);
  }

  if (thousandGroup > 0) {
    const mustReadHundreds = millionGroup > 0 && thousandGroup < 100;

    words.push(
      `${readThreeDigits(
        thousandGroup,
        mustReadHundreds,
        separatorWord,
      )} nghìn`,
    );
  }

  if (unitGroup > 0) {
    const hasHigherGroup =
      millionGroup > 0 || thousandGroup > 0 || forceLowerGroups;

    const mustReadHundreds = hasHigherGroup && unitGroup < 100;

    words.push(readThreeDigits(unitGroup, mustReadHundreds, separatorWord));
  }

  return words.join(" ").trim();
};

/**
 * Đọc số nguyên không âm theo từng khối tỷ.
 *
 * Ví dụ:
 * 10.000.000 => mười triệu
 * 1.005.000 => một triệu không trăm lẻ năm nghìn
 * 15.680.250.000
 * => mười lăm tỷ sáu trăm tám mươi triệu hai trăm năm mươi nghìn
 */
const readInteger = (number, separatorWord = "lẻ") => {
  if (number === 0) {
    return "không";
  }

  const billionGroups = [];

  let remaining = number;

  while (remaining > 0) {
    billionGroups.unshift(remaining % 1_000_000_000);
    remaining = Math.floor(remaining / 1_000_000_000);
  }

  const words = [];
  const lastIndex = billionGroups.length - 1;

  billionGroups.forEach((groupValue, index) => {
    const billionLevel = lastIndex - index;

    if (groupValue === 0) {
      return;
    }

    const hasPreviousGroup = words.length > 0;

    const groupText = readNineDigits(
      groupValue,
      hasPreviousGroup,
      separatorWord,
    );

    if (!groupText) {
      return;
    }

    const billionText =
      billionLevel > 0 ? ` ${"tỷ ".repeat(billionLevel).trim()}` : "";

    words.push(`${groupText}${billionText}`);
  });

  return words.join(" ").replace(/\s+/g, " ").trim();
};

const capitalizeFirstLetter = (text) => {
  if (!text) {
    return "";
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Chuyển số tiền thành chữ tiếng Việt.
 *
 * @param {number|string} value
 * @param {object} options
 * @param {"lẻ"|"linh"} options.separatorWord
 * @param {boolean} options.useTu
 * @param {string} options.currency
 * @param {boolean} options.only
 *
 * @returns {string}
 */
export const numberToVietnamese = (value, options = {}) => {
  const { separatorWord = "lẻ", currency = "đồng", only = false } = options;

  const normalizedValue = normalizeNumber(value);

  if (normalizedValue === 0) {
    return only ? `Không ${currency} chẵn` : `Không ${currency}`;
  }

  const isNegative = normalizedValue < 0;
  const absoluteValue = Math.abs(normalizedValue);

  const text = readInteger(absoluteValue, separatorWord);

  const result = [isNegative ? "âm" : "", text, currency, only ? "chẵn" : ""]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return capitalizeFirstLetter(result);
};

export default numberToVietnamese;
