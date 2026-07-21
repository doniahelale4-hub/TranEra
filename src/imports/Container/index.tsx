function Heading() {
  return (
    <div className="h-[22.5px] relative shrink-0 w-full" data-name="Heading 3">
      <p className="[word-break:break-word] absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[22.5px] left-0 not-italic text-[#0f172b] text-[18px] top-[0.5px] tracking-[-0.4395px] whitespace-nowrap">Hasr areas</p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[32px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="[word-break:break-word] absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] left-0 not-italic text-[#62748e] text-[12px] top-px w-[186px]">Filter which areas appear on the map</p>
    </div>
  );
}

function Container3() {
  return (
    <div className="h-[58.5px] relative shrink-0 w-[185.359px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-start relative size-full">
        <Heading />
        <Paragraph />
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d="M12 4L4 12" id="Vector" stroke="var(--stroke-0, #62748E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M4 4L12 12" id="Vector_2" stroke="var(--stroke-0, #62748E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="h-[32px] relative rounded-[10px] shrink-0 w-[28.641px]" data-name="Button">
      <div aria-hidden className="absolute border border-[#e2e8f0] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[6.32px] py-px relative size-full">
        <Icon />
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex h-[58.5px] items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Container3 />
      <Button />
    </div>
  );
}

function Button1() {
  return (
    <div className="absolute border border-[#e2e8f0] border-solid h-[38px] left-0 rounded-[10px] top-0 w-[103px]" data-name="Button">
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-[50.39px] not-italic text-[#1d293d] text-[14px] text-center top-[8.5px] tracking-[-0.1504px] whitespace-nowrap">Select all</p>
    </div>
  );
}

function Button2() {
  return (
    <div className="absolute border border-[#e2e8f0] border-solid h-[38px] left-[111px] rounded-[10px] top-0 w-[103px]" data-name="Button">
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-[50.63px] not-italic text-[#1d293d] text-[14px] text-center top-[8.5px] tracking-[-0.1504px] whitespace-nowrap">Clear</p>
    </div>
  );
}

function Container4() {
  return (
    <div className="h-[38px] relative shrink-0 w-full" data-name="Container">
      <Button1 />
      <Button2 />
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[148.5px] relative shrink-0 w-[254px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[16px] items-start pt-[20px] px-[20px] relative size-full">
        <Container2 />
        <Container4 />
      </div>
    </div>
  );
}

function Text() {
  return (
    <div className="bg-white relative rounded-[5px] shrink-0 size-[20px]" data-name="Text">
      <div aria-hidden className="absolute border-2 border-[#cad5e2] border-solid inset-0 pointer-events-none rounded-[5px]" />
    </div>
  );
}

function Container7() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <p className="[word-break:break-word] absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] left-0 not-italic text-[#0f172b] text-[14px] top-[0.5px] tracking-[-0.1504px] whitespace-nowrap">Area 00407</p>
    </div>
  );
}

function Container6() {
  return (
    <div className="flex-[90_0_0] h-[53px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Container7 />
        <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[16.5px] not-italic relative shrink-0 text-[#62748e] text-[11px] tracking-[0.0645px] w-full">80 meters · 20% done</p>
      </div>
    </div>
  );
}

function Container9() {
  return <div className="bg-[#00bc7d] h-[6px] relative shrink-0 w-full" data-name="Container" />;
}

function Container8() {
  return (
    <div className="bg-[#f1f5f9] h-[6px] relative rounded-[16777200px] shrink-0 w-[80px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip pr-[64px] relative rounded-[inherit] size-full">
        <Container9 />
      </div>
    </div>
  );
}

function Label() {
  return (
    <div className="content-stretch flex gap-[12px] h-[73px] items-center py-[10px] relative rounded-[10px] shrink-0 w-full" data-name="Label">
      <Text />
      <Container6 />
      <Container8 />
    </div>
  );
}

function Text1() {
  return (
    <div className="bg-white relative rounded-[5px] shrink-0 size-[20px]" data-name="Text">
      <div aria-hidden className="absolute border-2 border-[#cad5e2] border-solid inset-0 pointer-events-none rounded-[5px]" />
    </div>
  );
}

function Container11() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <p className="[word-break:break-word] absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] left-0 not-italic text-[#0f172b] text-[14px] top-[0.5px] tracking-[-0.1504px] whitespace-nowrap">Area 00408</p>
    </div>
  );
}

function Container10() {
  return (
    <div className="flex-[90_0_0] h-[53px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Container11 />
        <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[16.5px] not-italic relative shrink-0 text-[#62748e] text-[11px] tracking-[0.0645px] w-full">117 meters · 37% done</p>
      </div>
    </div>
  );
}

function Container13() {
  return <div className="bg-[#00bc7d] h-[6px] relative shrink-0 w-full" data-name="Container" />;
}

function Container12() {
  return (
    <div className="bg-[#f1f5f9] h-[6px] relative rounded-[16777200px] shrink-0 w-[80px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip pr-[50.406px] relative rounded-[inherit] size-full">
        <Container13 />
      </div>
    </div>
  );
}

function Label1() {
  return (
    <div className="content-stretch flex gap-[12px] h-[73px] items-center py-[10px] relative rounded-[10px] shrink-0 w-full" data-name="Label">
      <Text1 />
      <Container10 />
      <Container12 />
    </div>
  );
}

function Text2() {
  return (
    <div className="bg-white relative rounded-[5px] shrink-0 size-[20px]" data-name="Text">
      <div aria-hidden className="absolute border-2 border-[#cad5e2] border-solid inset-0 pointer-events-none rounded-[5px]" />
    </div>
  );
}

function Container15() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <p className="[word-break:break-word] absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] left-0 not-italic text-[#0f172b] text-[14px] top-[0.5px] tracking-[-0.1504px] whitespace-nowrap">Area 02502</p>
    </div>
  );
}

function Container14() {
  return (
    <div className="flex-[90_0_0] h-[53px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Container15 />
        <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[16.5px] not-italic relative shrink-0 text-[#62748e] text-[11px] tracking-[0.0645px] w-full">154 meters · 54% done</p>
      </div>
    </div>
  );
}

function Container17() {
  return <div className="bg-[#00bc7d] h-[6px] relative shrink-0 w-full" data-name="Container" />;
}

function Container16() {
  return (
    <div className="bg-[#f1f5f9] h-[6px] relative rounded-[16777200px] shrink-0 w-[80px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip pr-[36.805px] relative rounded-[inherit] size-full">
        <Container17 />
      </div>
    </div>
  );
}

function Label2() {
  return (
    <div className="content-stretch flex gap-[12px] h-[73px] items-center py-[10px] relative rounded-[10px] shrink-0 w-full" data-name="Label">
      <Text2 />
      <Container14 />
      <Container16 />
    </div>
  );
}

function Text3() {
  return (
    <div className="bg-white relative rounded-[5px] shrink-0 size-[20px]" data-name="Text">
      <div aria-hidden className="absolute border-2 border-[#cad5e2] border-solid inset-0 pointer-events-none rounded-[5px]" />
    </div>
  );
}

function Container19() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <p className="[word-break:break-word] absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] left-0 not-italic text-[#0f172b] text-[14px] top-[0.5px] tracking-[-0.1504px] whitespace-nowrap">Area 02503</p>
    </div>
  );
}

function Container18() {
  return (
    <div className="flex-[90_0_0] h-[53px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Container19 />
        <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[16.5px] not-italic relative shrink-0 text-[#62748e] text-[11px] tracking-[0.0645px] w-full">191 meters · 71% done</p>
      </div>
    </div>
  );
}

function Container21() {
  return <div className="bg-[#00bc7d] h-[6px] relative shrink-0 w-full" data-name="Container" />;
}

function Container20() {
  return (
    <div className="bg-[#f1f5f9] h-[6px] relative rounded-[16777200px] shrink-0 w-[80px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip pr-[23.203px] relative rounded-[inherit] size-full">
        <Container21 />
      </div>
    </div>
  );
}

function Label3() {
  return (
    <div className="content-stretch flex gap-[12px] h-[73px] items-center py-[10px] relative rounded-[10px] shrink-0 w-full" data-name="Label">
      <Text3 />
      <Container18 />
      <Container20 />
    </div>
  );
}

function Text4() {
  return (
    <div className="bg-white relative rounded-[5px] shrink-0 size-[20px]" data-name="Text">
      <div aria-hidden className="absolute border-2 border-[#cad5e2] border-solid inset-0 pointer-events-none rounded-[5px]" />
    </div>
  );
}

function Container23() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <p className="[word-break:break-word] absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] left-0 not-italic text-[#0f172b] text-[14px] top-[0.5px] tracking-[-0.1504px] whitespace-nowrap">Area 02504</p>
    </div>
  );
}

function Container22() {
  return (
    <div className="flex-[90_0_0] h-[53px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Container23 />
        <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[16.5px] not-italic relative shrink-0 text-[#62748e] text-[11px] tracking-[0.0645px] w-full">228 meters · 28% done</p>
      </div>
    </div>
  );
}

function Container25() {
  return <div className="bg-[#00bc7d] h-[6px] relative shrink-0 w-full" data-name="Container" />;
}

function Container24() {
  return (
    <div className="bg-[#f1f5f9] h-[6px] relative rounded-[16777200px] shrink-0 w-[80px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip pr-[57.602px] relative rounded-[inherit] size-full">
        <Container25 />
      </div>
    </div>
  );
}

function Label4() {
  return (
    <div className="content-stretch flex gap-[12px] h-[73px] items-center py-[10px] relative rounded-[10px] shrink-0 w-full" data-name="Label">
      <Text4 />
      <Container22 />
      <Container24 />
    </div>
  );
}

function Text5() {
  return (
    <div className="bg-white relative rounded-[5px] shrink-0 size-[20px]" data-name="Text">
      <div aria-hidden className="absolute border-2 border-[#cad5e2] border-solid inset-0 pointer-events-none rounded-[5px]" />
    </div>
  );
}

function Container27() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <p className="[word-break:break-word] absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] left-0 not-italic text-[#0f172b] text-[14px] top-[0.5px] tracking-[-0.1504px] whitespace-nowrap">Area 02504</p>
    </div>
  );
}

function Container26() {
  return (
    <div className="flex-[90_0_0] h-[53px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Container27 />
        <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[16.5px] not-italic relative shrink-0 text-[#62748e] text-[11px] tracking-[0.0645px] w-full">228 meters · 28% done</p>
      </div>
    </div>
  );
}

function Container29() {
  return <div className="bg-[#00bc7d] h-[6px] relative shrink-0 w-full" data-name="Container" />;
}

function Container28() {
  return (
    <div className="bg-[#f1f5f9] h-[6px] relative rounded-[16777200px] shrink-0 w-[80px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip pr-[57.602px] relative rounded-[inherit] size-full">
        <Container29 />
      </div>
    </div>
  );
}

function Label5() {
  return (
    <div className="content-stretch flex gap-[12px] h-[73px] items-center py-[10px] relative rounded-[10px] shrink-0 w-full" data-name="Label">
      <Text5 />
      <Container26 />
      <Container28 />
    </div>
  );
}

function Container5() {
  return (
    <div className="flex-[441_0_0] min-h-px relative w-[254px]" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[9px] px-[8px] relative size-full">
          <Label />
          <Label1 />
          <Label2 />
          <Label3 />
          <Label4 />
          <Label5 />
        </div>
      </div>
      <div aria-hidden className="absolute border-[#f1f5f9] border-solid border-t inset-0 pointer-events-none" />
    </div>
  );
}

export default function Container() {
  return (
    <div className="bg-white relative rounded-[14px] size-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] size-full">
        <Container1 />
        <Container5 />
      </div>
      <div aria-hidden className="absolute border border-[#e2e8f0] border-solid inset-0 pointer-events-none rounded-[14px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]" />
    </div>
  );
}