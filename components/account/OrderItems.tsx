import type { QuitHeroOrder } from "@/lib/quithero";
import ProductImage from "@/components/commerce/ProductImage";

export default function OrderItems({ order }: { order: QuitHeroOrder }) {
  if (!order.items?.length)
    return (
      <p className="account-order-items__empty">
        Product details are not available for this order.
      </p>
    );
  return (
    <ul className="account-order-items" aria-label="Products in this order">
      {order.items.map((item, index) => {
        const name = item.productName || item.variantName || "Order item";
        const total =
          item.total ??
          (item.price != null && item.price !== ""
            ? Number(item.price) * (item.quantity ?? 1)
            : undefined);
        return (
          <li className="account-order-items__item" key={`${item.variantId ?? "item"}-${index}`}>
            <ProductImage
              src={item.imageUrl}
              alt={name}
              width={72}
              height={72}
              sizes="72px"
              className="account-order-items__image"
            />
            <div className="account-order-items__description">
              <strong>{name}</strong>
              {item.productName && item.variantName && item.variantName !== "Default" && (
                <span>{item.variantName}</span>
              )}
              {item.sku && <small>SKU: {item.sku}</small>}
              <span>Qty: {item.quantity ?? 1}</span>
            </div>
            {total != null && total !== "" && Number.isFinite(Number(total)) && (
              <strong className="account-order-items__total">
                {new Intl.NumberFormat("en-AU", {
                  style: "currency",
                  currency: order.currencyCode || "AUD",
                }).format(Number(total))}
              </strong>
            )}
          </li>
        );
      })}
    </ul>
  );
}
