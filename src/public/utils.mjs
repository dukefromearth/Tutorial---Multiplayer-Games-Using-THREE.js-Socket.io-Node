export const hideDiv= (divName) => {
    let name = '#' + divName;
    $(name).children().hide();
}