import { isSampleFile } from './is-sample-file'

describe('isSampleFile', () => {
  it('Should indicate true if the file name contains the sample word', () => {
    expect(isSampleFile('star-wars-sample.mkv')).toBeTruthy()
  })

  it("Should indicate false if the file name doesn't contain the sample word", () => {
    expect(isSampleFile('star-wars.mkv')).toBeFalsy()
  })
})
