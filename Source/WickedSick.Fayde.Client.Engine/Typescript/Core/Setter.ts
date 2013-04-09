/// <reference path="XamlObject.ts" />
/// CODE

module Fayde {
    export class SetterCollection extends XamlObjectCollection {
        private _IsSealed: bool = false;

        _Seal(targetType: Function) {
            if (this._IsSealed)
                return;
            var enumerator = this.GetEnumerator();
            while (enumerator.MoveNext()) {
                (<Setter>enumerator.Current)._Seal(targetType);
            }
            this._IsSealed = true;
        }
        
        AddedToCollection(value: XamlObject, error: BError): bool {
            if (!value || !this._ValidateSetter(<Setter>value, error))
                return false;
            return super.AddedToCollection(value, error);
        }

        private _ValidateSetter(setter: Setter, error: BError) {

            if (setter.Property === undefined) {
                error.Message = "Cannot have a null PropertyProperty value";
                return false;
            }
            if (setter.Value === undefined) {
                //TODO: if (!setter._HasDeferredValueExpression(Fayde.Setter.ValueProperty)) {
                error.Message = "Cannot have a null ValueProperty value";
                return false;
                //}
            }
            if (this._IsSealed) {
                error.Message = "Cannot add a setter to a sealed style";
                return false;
            }
            return true;
        }
    }

    export class Setter extends XamlObject {
        private _IsSealed: bool = false;
        Property: DependencyProperty;
        Value: any;
        ConvertedValue: any;

        _Seal(targetType: Function) {
            var propd = this.Property;
            var val = this.Value;

            if (typeof propd.GetTargetType() === "string") {
                //if (val === undefined)
                //throw new ArgumentException("Empty value in setter.");
                if (typeof val !== "string")
                    throw new XamlParseException("Setter value does not match property type.");
            }

            try {
                this.ConvertedValue = Fayde.TypeConverter.ConvertObject(propd, val, targetType, true);
            } catch (err) {
                throw new XamlParseException(err.message);
            }
            this._IsSealed = true;
        }
    }
}