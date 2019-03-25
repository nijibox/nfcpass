export function arrayToHexString (arr: number[]): string {
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
