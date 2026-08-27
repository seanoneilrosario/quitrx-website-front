import type {StructureResolver} from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('products').title('Products'),
      S.documentTypeListItem('productCollection').title('Product Collections'),
      S.documentTypeListItem('category').title('Product Categories'),
      S.divider(),
      S.documentTypeListItem('post').title('Posts'),
      // S.documentTypeListItem('author').title('Authors'),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) => item.getId() && !['products', 'productCollection', 'post', 'category', 'author', 'image_document'].includes(item.getId()!),
      ),
      S.divider(),
      S.listItem()
        .title('Settings')
        .child(
          S.list()
            .title('Settings')
            .items([
              S.documentTypeListItem('image_document').title('Image Document'),
            ]),
        ),
    ])
