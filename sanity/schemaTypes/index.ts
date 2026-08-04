import { type SchemaTypeDefinition } from 'sanity'

import {blockContentType} from './blockContentType'
import {categoryType} from './categoryType'
import {postType} from './postType'
import {authorType} from './authorType'
import {navigationType} from './navigationType'
import {pageType} from './pageType'
import {homeType} from './homeType'
// import {footerType} from './footerType'
import {videoBanner} from '../components/video_banner'
import {banner} from '../components/banner'
import twoColumnLayout from '../components/twoColumnLayout'
import imageGrid from '../components/imageGrid'
import richtext_with_cta from '../components/richtext_with_cta'
import richtext_with_image from '../components/richtext_with_image'
import { richtextWithGroupedCTA } from '../components/richtextWithGroupedCTA'
import richtext from '../components/richtext'
import heading_with_link from '../components/heading_with_link'
import multi_row from '../components/multi_row'
import contact_section from '../components/contact_section'
import { productType } from './multiple/productType'
import { prescriptionComparison } from '../components/text_blocks'
import { imageDocument } from './settings/image_document'
import { escriptBanner } from '../components/escriptBanner'
import textBlockWithIcon from '../components/textBlockWithIcon'
import { textImage } from '../components/text_image'
import faq from '../components/faq'
import { externalForm } from '../components/external_form'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // templates
    blockContentType,
    categoryType,
    postType,
    authorType,
    navigationType,
    pageType,
    homeType,
    productType,
    imageDocument,
    // components
    videoBanner,
    banner,
    twoColumnLayout,
    imageGrid,
    richtext_with_cta,
    richtext_with_image,
    richtextWithGroupedCTA,
    richtext,
    heading_with_link,
    multi_row,
    contact_section,
    prescriptionComparison,
    escriptBanner,
    textBlockWithIcon,
    textImage,
    faq,
    externalForm
  ],
}
