export function arrayToHexString (arr) {
  let result = ''
  for (let i = 0; i < arr.length; i++) {
    const val = arr[i]
    if (val < 16) {
      result += '0'
    }
    result += val.toString(16)
  }
  return result.toUpperCase()
}
