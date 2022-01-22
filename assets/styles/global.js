import { createGlobalStyle } from 'styled-components'
import { colors, fonts } from './theme'
import 'typeface-karla'
import '@ag-grid-community/core/dist/styles/ag-grid.css'
import '@ag-grid-community/core/dist/styles/ag-theme-alpine.css'

export const GlobalStyle = createGlobalStyle`
	html,
	body {
		background-color: ${colors.appBackground};
		font-family: ${fonts.family};
		font-style: normal;
		height: 100%;
		line-height: ${fonts.lineHeight};
		margin: 0;
		min-height: 100vh;
		// for IOS Mobile to account for navigation bars...JK
		min-height: -webkit-fill-available;
		overflow-x: hidden;
		overflow-y: hidden;
		padding: 0;
		position: relative;
		position: fixed;
		text-rendering: optimizeLegibility;
		width: 100%;
	}

	a {
		color: inherit;
		cursor: pointer;
		text-decoration: none;
	}

	* {
		box-sizing: border-box;
		font-family: ${fonts.family};
		line-height: ${fonts.lineHeight};
	}

	button {
		cursor: pointer;
		outline: none;
	}

  // Override ag-grid styles...KA	
	.ag-root-wrapper {
    border: none !important;
    border-radius: 10px;
  }

  .ag-header-viewport {
      background-color: ${colors.blurple}20;
      
    .ag-header-cell {
      border-right: 1.5px solid ${colors.gray8};
    }
  }

  // hides the resize bar...KA
  .ag-header-cell-resize::after {
    background-color: transparent !important;
  }

  .ag-row-even {
    background-color: ${colors.white} !important;
    border: none !important;

    .ag-cell {
      border-right: 1.5px solid ${colors.gray8} !important;
      user-select: text;
    }

    &:hover {
      background-color: ${colors.blurple}20 !important;
    }
  }

  .ag-row-odd {
    background-color: ${colors.blurple}08 !important;
    border: none !important;

    .ag-cell {
      border-right: 1.5px solid ${colors.gray8} !important;
      user-select: text;
    }

    &:hover {
      background-color: ${colors.blurple}20 !important;
    }
  }

  .ag-cell-focus,
  .ag-cell-no-focus {
    border: none !important;
    border-right: 1.5px solid ${colors.gray8} !important;
  }

  .ag-row-selected {
    background-color: ${colors.blurple}20 !important;
  }
`
