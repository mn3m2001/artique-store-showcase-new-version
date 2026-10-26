"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MoveUpRight, MapPin, Scissors, ShieldCheck, Star } from "lucide-react";
import type { Category, Product, StoreSettings } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { ProductCard } from "@/components/products/ProductCard";
import { PhotoTourIntro } from "./PhotoTourIntro";

export function AtelierHome({ settings, categories, featuredProducts }: {
  settings: StoreSettings; categories: Category[]; featuredProducts: Product[]; isDemo: boolean;
}) {
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const reviews = (settings.customer_reviews || []).filter((review) => review.published && review.confirmed);
  return <main className="atelier-home">
    {(settings.show_hero_section ?? true) && <PhotoTourIntro settings={settings} />}
    {(settings.show_trust_banner ?? true) && <div className="atelier-promises"><span><MapPin size={15} />{ar ? "من دمياط، بكل حب" : "From Damietta, with love"}</span><span><Scissors size={15} />{ar ? "كل قطعة تحمل أثر اليد" : "Every piece carries a human touch"}</span><span><ShieldCheck size={15} />{ar ? "دفع مرن • توصيل داخل دمياط" : "Flexible payments • Damietta delivery"}</span></div>}

    {(settings.show_categories_section ?? true) && <section id="categories" className="atelier-section atelier-collections">
      <div className="atelier-section-heading"><div><span className="atelier-eyebrow">01 / {ar ? "عوالم آرتيك" : "THE COLLECTIONS"}</span><h2>{ar ? "اختر عالمًا يشبهك." : "Find a world that feels like you."}</h2></div><p>{ar ? "تفصيلة لبيتك. رفيق ليومك.\nأو هدية تقول أكثر من الكلمات." : "A detail for your home. A companion for your day.\nOr a gift that says a little more."}</p></div>
      <div className="atelier-category-grid">{categories.slice(0, 4).map((category, index) => <Link className="atelier-category" href={`/products?category=${category.slug}`} key={category.id}>
        <div className="atelier-category-image"><Image src={category.cover_image} alt={ar ? category.name_ar : category.name_en} fill sizes="(max-width: 600px) 50vw, 25vw" className="object-cover" /><span className="atelier-category-number">0{index + 1}</span><span className="atelier-category-arrow"><MoveUpRight size={22} /></span></div>
        <span className="atelier-eyebrow">{ar ? category.name_en : "ARTIQUE COLLECTION"}</span><h3>{ar ? category.name_ar : category.name_en}</h3>
      </Link>)}</div>
      {categories.length > 4 && <div className="atelier-more-categories"><span>{ar ? "والمزيد من الحكايات" : "MORE LITTLE WORLDS"}</span>{categories.slice(4).map((category) => <Link key={category.id} href={`/products?category=${category.slug}`}>{ar ? category.name_ar : category.name_en}<MoveUpRight size={13} /></Link>)}</div>}
    </section>}

    {(settings.show_featured_section ?? true) && featuredProducts.length > 0 && <section id="shop" className="atelier-section atelier-shop"><div className="atelier-section-heading"><div><span className="atelier-eyebrow">02 / {ar ? "مختارات الأتيليه" : "ATELIER PICKS"}</span><h2>{ar ? "قطع صغيرة. أثر كبير." : "Little pieces. Lasting feeling."}</h2></div><Link href="/products" className="atelier-text-link">{ar ? "اكتشف المتجر بالكامل" : "Explore the entire shop"}<Arrow size={18} /></Link></div><div className="atelier-product-grid">{featuredProducts.slice(0, 6).map((product) => <ProductCard product={product} key={product.id} />)}</div></section>}

    {(settings.show_journey_section ?? true) && <section id="journey" className="atelier-journey"><div className="atelier-journey-image"><Image src={settings.hero_image_url} alt={ar ? "تفاصيل الكروشيه اليدوي من آرتيك" : "Artique handcrafted crochet details"} fill sizes="(max-width: 700px) 100vw, 50vw" className="object-cover" /><span>THE BEAUTY OF SLOW MAKING</span></div><div className="atelier-journey-copy"><span className="atelier-eyebrow">03 / {ar ? "رحلة الغرزة" : "THE PROCESS"}</span><h2>{ar ? "الجمال،\nفي الوقت الذي نمنحه." : "Beauty lives\nin the time we give."}</h2><p>{ar ? "نختار الخيط، نتأمل اللون، وننسج كل غرزة على مهل. ليس لأننا نحب الانتظار؛ بل لأن الأشياء التي تستحق تبقى." : "We choose the yarn, find the color, and make every stitch slowly. Because the things worth making are the things worth keeping."}</p><div className="atelier-process"><span><b>01</b>{ar ? "خيط مختار" : "Chosen yarn"}</span><span><b>02</b>{ar ? "يد تصنع" : "Human hands"}</span><span><b>03</b>{ar ? "حكاية تبقى" : "A story to keep"}</span></div><Link href="/products" className="atelier-text-link">{ar ? "اختر قطعتك وأضف لمستك" : "Choose a piece, make it yours"}<Arrow size={18} /></Link></div></section>}

    {(settings.show_story_section ?? true) && <section id="story" className="atelier-section atelier-story"><div><span className="atelier-eyebrow">04 / {ar ? "حكاية آرتيك" : "OUR STORY"}</span><h2>{ar ? "وراء كل غرزة،\nيد وقلب." : "Behind every stitch,\na hand and a heart."}</h2><p>{ar ? settings.brand_story_ar : settings.brand_story_en || settings.brand_story_ar}</p><a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="atelier-text-link">{ar ? "كواليس الأتيليه على إنستغرام" : "Behind the scenes on Instagram"}<MoveUpRight size={17} /></a></div><div className="atelier-story-image"><Image src={settings.brand_story_image_url} alt={ar ? "عالم آرتيك للمشغولات اليدوية" : "The world of Artique handmade crafts"} fill sizes="(max-width: 700px) 100vw, 45vw" className="object-cover" /><span>MADE WITH INTENTION.<br />KEPT WITH LOVE.</span></div></section>}

    <section className="atelier-section atelier-gifts"><div><span className="atelier-eyebrow">A LITTLE GIFT, A LOT OF FEELING</span><h2>{ar ? "هدية تقول:\nفكّرت فيك." : "A gift that says:\nI thought of you."}</h2><p>{ar ? "اختر قطعة، وأضف رسالة وملاحظات المناسبة أثناء إتمام الطلب." : "Choose a piece and add a message and occasion notes at checkout."}</p><p>{settings.gift_wrap_available ? (ar ? settings.gift_wrap_description_ar : settings.gift_wrap_description_en) || (ar ? "يمكنك طلب تغليف هدية؛ التفاصيل والتكلفة تُؤكد مع المتجر قبل التجهيز." : "Gift wrapping can be requested; details and cost are confirmed with the shop before preparation.") : ar ? "لأي طلب تغليف خاص، أضف ملاحظتك ليتأكد المتجر من إمكانية تنفيذه والتكلفة." : "Add a note for special packaging so the shop can confirm availability and cost."}</p><Link href="/products?category=flowers" className="atelier-button">{ar ? "اكتشف قطع الهدايا" : "Discover gift pieces"}<Arrow size={17} /></Link></div><div className="atelier-gift-image"><Image src={categories.find((category) => category.slug === "flowers")?.cover_image || settings.hero_image_url} alt={ar ? "قطعة كروشيه من آرتيك للهدايا" : "An Artique crochet gift piece"} fill sizes="(max-width:700px) 90vw, 45vw" className="object-contain" /></div></section>
    {reviews.length > 0 && <section className="atelier-section atelier-reviews"><div className="atelier-section-heading"><div><span className="atelier-eyebrow">WORDS FROM OUR CUSTOMERS</span><h2>{ar ? "حكايات وصلت لأصحابها." : "Stories that found their people."}</h2></div></div><div className="atelier-review-grid">{reviews.map((review) => <blockquote key={review.id}><div className="atelier-review-stars" aria-label={`${review.rating} / 5`}>{Array.from({ length: review.rating }, (_, index) => <Star size={14} fill="currentColor" key={index} />)}</div><p>“{ar ? review.quote_ar : review.quote_en || review.quote_ar}”</p><cite>{review.name}</cite></blockquote>)}</div></section>}
    {(settings.show_policies_section ?? true) && <section className="atelier-section atelier-policies">{[
      [ar ? "من الأتيليه إلى بابك" : "From atelier to doorstep", ar ? settings.shipping_policy_ar : settings.shipping_policy_en, ar ? "توصيل داخل محافظة دمياط حسب المنطقة المختارة." : "Delivery within Damietta, based on your selected area."],
      [ar ? "قطعة بطريقتك" : "Made your way", ar ? settings.custom_orders_policy_ar : settings.custom_orders_policy_en, ar ? "أضف اختيارات اللون والملاحظات عند اختيار القطعة." : "Add your color preferences and notes when choosing a piece."],
      [ar ? "اهتمام حتى بعد الوصول" : "Care beyond delivery", ar ? settings.return_policy_ar : settings.return_policy_en, ar ? "تواصل معنا لمراجعة الاستبدال أو أي مشكلة في طلبك." : "Contact us to review an exchange or an issue with your order."],
    ].map(([title, text, fallback], index) => <div key={title}><span className="atelier-eyebrow">0{index + 1}</span><h3>{title}</h3><p>{text || fallback}</p></div>)}</section>}
    <div className="atelier-signoff"><span>artique</span><p>{ar ? "أشياء نصنعها باليد. مشاعر نحتفظ بها." : "Things we make by hand. Feelings we keep."}</p></div>
  </main>;
}
