import { Shade, createComponent } from '@furystack/shades'
import { GenericErrorPage } from './generic-error.js'

export const Error404 = Shade({
  shadowDomName: 'shade-404-not-found',
  render: () => {
    return (
      <GenericErrorPage
        subtitle="The page you are looking for is not exists 😓"
        description={
          <div style={{ maxWidth: '400px' }}>
            <p>
              It seems to be the page you are looking for is missing or you does not have a permission to see it...
              <br /> You can check the following things:
            </p>
            <ul>
              <li>The URL above is correct.</li>
              <li>You have logged in</li>
              <li>You have the neccessary permissions</li>
            </ul>
          </div>
        }
      />
    )
  },
})
